import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
      scope: ['email', 'profile', 'https://www.googleapis.com/auth/calendar.events'],
      passReqToCallback: true,
      accessType: 'offline',
      prompt: 'consent',
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const user = await this.authService.upsertGoogleUser({
      id: profile.id,
      email: profile.emails[0].value,
      givenName: profile.name?.givenName,
      familyName: profile.name?.familyName,
      avatar: profile.photos?.[0]?.value,
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken,
    });

    if (!user) {
      return done(new Error('Failed to upsert user'));
    }

    done(null, user);
  }
}
