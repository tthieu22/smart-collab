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
      const userObj = { ...user } as any;
      delete userObj.password;
      return userObj;
    }
    return null;
  }

  async login(user: any) {
    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  async validateGoogleLogin(profile: any) {
    let user = await this.userService.findByEmail(profile.emails[0].value);
    if (!user) {
      const googleUser: CreateGoogleUserDto = {
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        isEmailVerified: true,
      };
      user = await this.userService.createGoogleUser(googleUser);
    }
    const userObj = (user as any).toObject
      ? (user as any).toObject()
      : { ...user };
    delete userObj.password;
    return userObj;
  }
}
