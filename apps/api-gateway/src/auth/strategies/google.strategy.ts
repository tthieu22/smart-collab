import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly authService: AuthService) {
    const callbackURL =
      process.env.GOOGLE_CALLBACK_URL ||
      'https://smart-collab.onrender.com/api/auth/google/redirect';

    const clientID = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    // 🔥 LOG DEBUG QUAN TRỌNG
    console.log('================ GOOGLE OAUTH DEBUG ================');
    console.log('GOOGLE_CLIENT_ID:', clientID);
    console.log('GOOGLE_CALLBACK_URL:', callbackURL);
    console.log('====================================================');

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      accessType: 'offline',
      prompt: 'consent',
      passReqToCallback: true,
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

    done(null, user);
  }

  authorizationParams(): any {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }
}