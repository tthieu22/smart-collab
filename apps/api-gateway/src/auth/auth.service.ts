import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { AuthMessageHandler } from './internal/message-handlers/auth.message-handler';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  RefreshRequest, 
  LogoutRequest, 
  LogoutAllRequest, 
  GetUserRequest, 
  ValidateUserRequest, 
  VerifyEmailRequest, 
  GoogleAuthRequest 
} from './auth.service.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(forwardRef(() => AuthMessageHandler))
    private readonly handler: AuthMessageHandler,
  ) {}

  async login(loginDto: LoginRequest): Promise<any> {
    return this.handler.handleLogin(loginDto);
  }

  async register(registerDto: RegisterRequest): Promise<any> {
    return this.handler.handleRegister(registerDto);
  }

  async refresh(refreshDto: RefreshRequest): Promise<any> {
    return this.handler.handleRefresh(refreshDto);
  }

  async logout(logoutDto: LogoutRequest): Promise<any> {
    return this.handler.handleLogout(logoutDto);
  }

  async logoutAll(logoutAllDto: LogoutAllRequest): Promise<any> {
    return this.handler.handleLogoutAll(logoutAllDto);
  }

  async getCurrentUser(getUserDto: GetUserRequest): Promise<any> {
    return this.handler.handleGetCurrentUser(getUserDto);
  }

  async validateUser(validateDto: ValidateUserRequest): Promise<any> {
    return this.handler.handleValidateUser(validateDto);
  }

  async verifyEmail(verifyDto: VerifyEmailRequest): Promise<any> {
    return this.handler.handleVerifyEmail(verifyDto);
  }

  async upsertGoogleUser(payload: any): Promise<any> {
    return this.handler.handleUpsertGoogleUser(payload);
  }

  async generateOAuthCode(payload: { userId: string; email: string; role?: string }): Promise<any> {
    return this.handler.handleGenerateOAuthCode(payload);
  }

  async oauthExchange(payload: { code: string }): Promise<any> {
    return this.handler.handleOAuthExchange(payload);
  }

  async updateProfile(payload: { userId: string; data: any }): Promise<any> {
    return this.handler.handleUpdateProfile(payload);
  }

  async changePassword(payload: { userId: string; data: any }): Promise<any> {
    return this.handler.handleChangePassword(payload);
  }

  async resendCode(payload: { email: string }): Promise<any> {
    return this.handler.handleResendCode(payload);
  }

  async disconnectGoogle(payload: { userId: string }): Promise<any> {
    return this.handler.handleDisconnectGoogle(payload);
  }

  async removeAccount(payload: { userId: string; password?: string }): Promise<any> {
    return this.handler.handleRemoveAccount(payload);
  }

  async getLogs(payload: { userId: string }): Promise<any> {
    return this.handler.handleGetLogs(payload);
  }

  async exportData(payload: { userId: string }): Promise<any> {
    return this.handler.handleExportData(payload);
  }

  async generateQrToken(payload: { context?: { ip?: string; ua?: string } }): Promise<any> {
    return this.handler.handleGenerateQrToken(payload);
  }

  async scanQrToken(payload: { token: string; userId: string }): Promise<any> {
    return this.handler.handleScanQrToken(payload);
  }

  async confirmQrToken(payload: { token: string; userId: string }): Promise<any> {
    return this.handler.handleConfirmQrToken(payload);
  }

  async checkQrStatus(payload: { token: string }): Promise<any> {
    return this.handler.handleCheckQrStatus(payload);
  }

  async getDevices(payload: { userId: string }): Promise<any> {
    return this.handler.handleGetDevices(payload);
  }

  async removeDevice(payload: { userId: string; deviceId: string }): Promise<any> {
    return this.handler.handleRemoveDevice(payload);
  }

  async searchUsers(payload: { q: string }): Promise<any> {
    return this.handler.handleSearchUsers({ query: payload.q });
  }

  async checkEmails(payload: { emails: string[] }): Promise<any> {
    return this.handler.handleCheckEmails(payload);
  }

  async getSuggestions(payload: { userId: string; page?: number; limit?: number; type?: string }): Promise<any> {
    return this.handler.handleGetSuggestions(payload);
  }

  async toggleFollow(payload: { followerId: string; followingId: string }): Promise<any> {
    return this.handler.handleToggleFollow(payload);
  }

  async getFollowRelation(payload: { targetId: string; observerId?: string }): Promise<any> {
    return this.handler.handleGetProfileRelation(payload);
  }
}
