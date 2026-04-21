import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';
import { syncCreateUser, syncUpdateUser } from '../../message-handlers/common/sync.helper';

type JwtPayload = { sub: string; email: string; role: string };
type TokenMeta = Partial<{ ip: string; ua: string; device: string }>;
type RotateOptions = { revokeOnly?: boolean };

@Injectable()
export class AuthService {
  private readonly accessTokenTTL: string;
  private readonly refreshTokenTTL: number;

  /** Bộ nhớ tạm cho OAuth Code */
  private otcs: Record<
    string,
    { userId: string; email: string; role?: string; expiresAt: number }
  > = {};

  constructor(
    private readonly users: UserService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.accessTokenTTL =
      this.config.get<string>('JWT_ACCESS_EXPIRES') || '15m';
    this.refreshTokenTTL = Number(this.config.get<number>('REFRESH_DAYS')) || 7;
  }

  /** 🔐 Tạo Access Token */
  private signAccessToken(payload: JwtPayload) {
    return this.jwt.sign(payload, { expiresIn: this.accessTokenTTL as any });
  }

  /** 🔑 Sinh Refresh Token mới */
  private async mintRefreshToken(userId: string, meta?: TokenMeta) {
    const raw = randomBytes(64).toString('hex');
    const hashed = await argon2.hash(raw);
    const expiresAt = addDays(new Date(), this.refreshTokenTTL);

    const tokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId,
        hashedToken: hashed,
        expiresAt,
        ip: meta?.ip ?? null,
        userAgent: meta?.ua ?? null,
        device: meta?.device ?? null,
      },
    });

    return { raw, tokenId: tokenRecord.id, expiresAt };
  }

  /** 📦 Cấp Access + Refresh Token */
  async issueTokensForUser(
    user: { id: string; email: string; role: string },
    meta?: TokenMeta,
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.signAccessToken(payload);
    const { raw, tokenId, expiresAt } = await this.mintRefreshToken(
      user.id,
      meta,
    );

    return {
      accessToken,
      accessTokenExpiresIn: this.accessTokenTTL,
      refreshToken: `${tokenId}.${raw}`,
      refreshTokenExpiresAt: expiresAt,
    };
  }

  /** ✅ Kiểm tra Refresh Token hợp lệ */
  async validateRefreshToken(token: string) {
    const [id, raw] = token.split('.');
    if (!id || !raw)
      throw new UnauthorizedException('Invalid refresh token format');

    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { id, revoked: false, expiresAt: { gt: new Date() } },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const isValid = await argon2.verify(tokenRecord.hashedToken, raw);
    if (!isValid) {
      await this.logoutAllDevices(tokenRecord.userId);
      throw new ForbiddenException(
        'Token reuse detected. All sessions revoked.',
      );
    }

    return {
      userId: tokenRecord.userId,
      tokenId: tokenRecord.id,
      expiresAt: tokenRecord.expiresAt,
    };
  }

  /** 🔄 Refresh Token (rotate) */
  async rotateRefreshToken(
    userId: string,
    token: string,
    meta?: TokenMeta,
    options?: RotateOptions,
  ) {
    const [id] = token.split('.');
    if (!id) throw new UnauthorizedException('Invalid refresh token');

    if (options?.revokeOnly) {
      await this.revokeRefreshToken(id);
      return;
    }

    await this.revokeRefreshToken(id);

    const user = await this.users.findOne(userId);
    if (!user) throw new UnauthorizedException('User not found');

    return this.issueTokensForUser(
      { id: user.id, email: user.email, role: user.role as string },
      meta,
    );
  }

  /** ❌ Thu hồi Refresh Token */
  async revokeRefreshToken(tokenId: string) {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revoked: true },
    });
  }

  /** 🚪 Logout tất cả thiết bị */
  async logoutAllDevices(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  /** 🧹 Xóa token hết hạn */
  async cleanupExpiredTokens() {
    await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  /** 👤 Upsert Google User */
  async upsertGoogleUser(payload: {
    email: string;
    givenName?: string;
    familyName?: string;
    avatar?: string;
    id?: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: payload.email,
          firstName: payload.givenName ?? null,
          lastName: payload.familyName ?? null,
          avatar: payload.avatar ?? null,
          role: "USER",
          googleId: payload.id ?? null,
        },
      });

      await syncCreateUser({
        id: user.id,
        email: user.email,
      });
  
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.id ?? user.googleId,
          avatar: payload.avatar ?? user.avatar,
        },
      });

      await syncUpdateUser({
        id: user.id,
        email: user.email
      });
    }

    return user;
  }

  /** 🔑 Sinh OAuth Code */
  async generateOAuthCode(payload: {
    userId: string;
    email: string;
    role?: string;
  }) {
    const code = randomBytes(24).toString('hex');
    this.otcs[code] = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role as string,
      expiresAt: Date.now() + 120000, // 2 phút
    };
    return { code };
  }

  /** 🔄 Đổi OAuth Code lấy Token */
  async exchangeOAuthCode(code: string) {
    const rec = this.otcs[code];
    if (!rec || rec.expiresAt < Date.now()) return null;

    delete this.otcs[code]; // one-time code

    const user = await this.users.findOne(rec.userId);
    if (!user) return null;

    return this.issueTokensForUser(user);
  }

  /** 📱 QR Login Logic */
  async generateQrToken(context?: { ip?: string; ua?: string }) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    return this.prisma.qrLogin.create({
      data: { 
        token, 
        expiresAt,
        ip: context?.ip,
        userAgent: context?.ua
      },
    });
  }

  async scanQrToken(token: string, userId: string) {
    const qr = await this.prisma.qrLogin.findUnique({ where: { token } });
    if (!qr || qr.expiresAt < new Date()) {
      throw new Error('Mã QR không hợp lệ hoặc đã hết hạn');
    }

    return this.prisma.qrLogin.update({
      where: { token },
      data: { userId, status: 'SCANNED' },
    });
  }

  async confirmQrToken(token: string, userId: string) {
    const qr = await this.prisma.qrLogin.findUnique({ where: { token } });
    if (!qr || qr.status === 'EXPIRED' || qr.expiresAt < new Date()) {
      throw new Error('Mã QR không hợp lệ hoặc đã hết hạn');
    }

    return this.prisma.qrLogin.update({
      where: { token },
      data: { userId, status: 'CONFIRMED' },
    });
  }

  async checkQrStatus(token: string) {
    const qr = await this.prisma.qrLogin.findUnique({ where: { token } });
    if (!qr) throw new Error('Mã QR không tồn tại');

    if (qr.status === 'EXPIRED' || qr.expiresAt < new Date()) {
      if (qr.status === 'PENDING' || qr.status === 'SCANNED') {
        await this.prisma.qrLogin.update({ where: { token }, data: { status: 'EXPIRED' } });
      }
      return { status: 'EXPIRED' };
    }

    if (qr.status === 'SCANNED') {
      return { status: 'SCANNED' };
    }

    if (qr.status === 'CONFIRMED' && qr.userId) {
      const user = await this.users.findOne(qr.userId);
      if (!user) throw new Error('User not found');

      const tokens = await this.issueTokensForUser({
        id: user.id,
        email: user.email,
        role: user.role as string,
      });

      // Track device
      await this.prisma.device.create({
        data: {
          userId: user.id,
          refreshToken: tokens.refreshToken,
          ip: qr.ip,
          userAgent: qr.userAgent,
          deviceName: qr.userAgent ? this.parseUA(qr.userAgent) : 'Unknown Device',
        }
      });

      // Cleanup
      await this.prisma.qrLogin.delete({ where: { token } });

      return { status: 'CONFIRMED', ...tokens, user };
    }

    return { status: 'PENDING' };
  }

  private parseUA(ua: string) {
    if (ua.includes('Windows')) return 'Chrome on Windows';
    if (ua.includes('iPhone')) return 'Safari on iPhone';
    if (ua.includes('Android')) return 'Chrome on Android';
    if (ua.includes('Macintosh')) return 'Safari on Mac';
    return 'Unknown Device';
  }
}
