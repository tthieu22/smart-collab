import { IsEmail, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class LoginMessageDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterMessageDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}

export class RefreshMessageDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutMessageDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutAllMessageDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class GetUserMessageDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class ValidateUserMessageDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class VerifyEmailMessageDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

export class GoogleAuthMessageDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  givenName?: string;

  @IsString()
  @IsOptional()
  familyName?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class OAuthExchangeMessageDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

// Response DTOs
export interface AuthResponseDto {
  success: boolean;
  message: string;
  data?: any;
}

export interface LoginResponseDto extends AuthResponseDto {
  data?: {
    accessToken?: string;
    refreshToken?: string;
    refreshTokenExpiresAt?: string;
    user?: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
      role: string;
    };
    needsVerified?: boolean;
    needsPassword?: boolean;
  };
}

export interface RegisterResponseDto extends AuthResponseDto {
  data?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isVerified: boolean;
  };
}

export interface RefreshResponseDto extends AuthResponseDto {
  data?: {
    accessToken: string;
    refreshToken?: string;
    refreshTokenExpiresAt?: string;
  };
}

export interface UserResponseDto extends AuthResponseDto {
  data?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    role: string;
    isVerified: boolean;
  };
}
