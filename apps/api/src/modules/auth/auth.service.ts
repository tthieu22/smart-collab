import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';
import { CreateGoogleUserDto } from '../user/dto/create-google-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (
      user &&
      typeof user.password === 'string' &&
      (await bcrypt.compare(password, user.password))
    ) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'your-secret',
      });
      const payload = {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      const newRefreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d',
      });
      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateGoogleLogin(profile: any) {
    let user = await this.userService.findByEmail(profile.emails[0].value);
    if (!user) {
      const googleUser: CreateGoogleUserDto = {
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        isVerified: true,
        googleId: profile.id,
      };
      user = await this.userService.createGoogleUser(googleUser);
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByGoogleId(googleId: string) {
    // Thêm method này vào UserService nếu cần
    // Hoặc sử dụng PrismaService trực tiếp
    return this.userService.findByGoogleId(googleId);
  }
}
