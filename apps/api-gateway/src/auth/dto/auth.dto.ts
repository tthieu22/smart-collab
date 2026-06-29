import { IsEmail, IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsBoolean()
  bypassVerification?: boolean;
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsOptional()
  @IsBoolean()
  bypassVerification?: boolean;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class LogoutDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class VerifyEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class ValidateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class OAuthExchangeDto {
  @IsString()
  @IsNotEmpty()
  code!: string;
}
