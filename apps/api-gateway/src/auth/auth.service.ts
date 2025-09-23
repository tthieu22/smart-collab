import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutAllRequest {
  userId: string;
}

export interface GetUserRequest {
  userId: string;
}

export interface ValidateUserRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface GoogleAuthRequest {
  id: string;
  email: string;
  givenName?: string;
  familyName?: string;
  avatar?: string;
}

export interface OAuthExchangeRequest {
  code: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  async login(loginDto: LoginRequest): Promise<AuthResponse> {
    try {
      this.logger.log(`Login attempt for email: ${loginDto.email}`);
      const result = await firstValueFrom(
        this.authClient.send({cmd: 'auth.login'}, loginDto),
      );
      return result;
    } catch (error: any) {
      this.logger.error('Login error:', error);
      throw error;
    }
  }

  async register(registerDto: RegisterRequest): Promise<AuthResponse> {
    try {
      this.logger.log(`Register attempt for email: ${registerDto.email}`);
      const result = await firstValueFrom(
        this.authClient.send({ cmd:'auth.register'}, registerDto),
      );
      return result;
    } catch (error: any) {
      this.logger.error('Register error:', error);
      throw error;
    }
  }
  async refresh(refreshDto: RefreshRequest): Promise<AuthResponse> {
    try {
      this.logger.log('🔄 Refresh token attempt');
      this.logger.debug(`📤 Sending message to pattern "auth.refresh" with DTO: ${JSON.stringify(refreshDto)}`);

      const result = await firstValueFrom(
        this.authClient.send({ cmd:'auth.refresh'}, refreshDto),
      );

      this.logger.debug(`✅ Received response from auth.refresh: ${JSON.stringify(result)}`);
      return result;
    } catch (error: any) {
      this.logger.error('❌ Refresh error:', error.message || error);
      throw error;
    }
  }

  async logout(logoutDto: LogoutRequest): Promise<AuthResponse> {
    try {
      this.logger.log('Logout attempt');
      const result = await firstValueFrom(
        this.authClient.send({cmd:'auth.logout'}, logoutDto),
      );
      return result;
    } catch (error: any) {
      this.logger.error('Logout error:', error);
      throw error;
    }
  }

  async logoutAll(logoutAllDto: LogoutAllRequest): Promise<AuthResponse> {
    try {
      this.logger.log(`Logout all devices for user: ${logoutAllDto.userId}`);
      const result = await firstValueFrom(
        this.authClient.send({cmd:'auth.logoutAll'}, logoutAllDto),
      );
      return result;
    } catch (error: any) {
      this.logger.error('Logout all error:', error);
      throw error;
    }
  }

  async getCurrentUser(getUserDto: GetUserRequest): Promise<AuthResponse> {
    try {
      this.logger.log(`Get current user: ${getUserDto.userId}`);
      const result = await firstValueFrom(
        this.authClient.send({cmd:'auth.me'}, getUserDto),
      );
      return result;
    } catch (error: any) {
      this.logger.error('Get current user error:', error);
      throw error;
    }
  }

  async validateUser(validateDto: ValidateUserRequest): Promise<AuthResponse> {
    try {
      this.logger.log(`Validate user: ${validateDto.email}`);
      const result = await firstValueFrom(
        this.authClient.send({cmd:'auth.validateUser'}, validateDto),
      );
      return result;
    } catch (error: any) {
      this.logger.error('Validate user error:', error);
      throw error;
    }
  }

  async verifyEmail(verifyDto: VerifyEmailRequest): Promise<AuthResponse> {
    try {
      this.logger.log(`Verify email: ${verifyDto.email}`);
      const result = await firstValueFrom(
        this.authClient.send({cmd: 'auth.verifyEmail'}, verifyDto),
      );
      return result;
    } catch (error: any) {
      this.logger.error('Verify email error:', error);
      throw error;
    }
  }

  async googleAuth(googleDto: GoogleAuthRequest): Promise<AuthResponse> {
    try {
      this.logger.log(`Google auth for: ${googleDto.email}`);
      const result = await firstValueFrom(
        this.authClient.send({cmd: 'auth.googleAuth'}, googleDto),
      );
      return result;
    } catch (error: any) {
      this.logger.error('Google auth error:', error);
      throw error;
    }
  }

  async upsertGoogleUser(payload: any) {
    this.logger.log('RPC -> auth.upsertGoogleUser');
    return firstValueFrom(
      this.authClient.send({ cmd: 'auth.upsertGoogleUser' }, payload).pipe(timeout(5000)),
    );
  }

  async generateOAuthCode(payload: { userId: string; email: string; role?: string }) {
    this.logger.log('RPC -> auth.generateOAuthCode');
    return firstValueFrom(
      this.authClient.send({ cmd: 'auth.generateOAuthCode' }, payload).pipe(timeout(5000)),
    );
  }

  async oauthExchange(payload: { code: string }) {
    this.logger.log('RPC -> auth.oauthExchange');
    console.log("code", payload.code);
    return firstValueFrom(
      this.authClient.send({ cmd: 'auth.oauthExchange' }, payload).pipe(timeout(5000)),
    );
  }

}
