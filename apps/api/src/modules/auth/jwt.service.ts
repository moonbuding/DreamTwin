import { Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import type { AuthenticatedUser } from './auth.types';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dreamtwin-dev-secret');
const ALG = 'HS256';
const EXPIRES_IN = '30d';

@Injectable()
export class JwtService {
  async sign(user: AuthenticatedUser): Promise<string> {
    return new SignJWT({ phone: user.phone, nickname: user.nickname })
      .setProtectedHeader({ alg: ALG })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(EXPIRES_IN)
      .sign(SECRET);
  }

  async verify(token: string): Promise<AuthenticatedUser | null> {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (!payload.sub) return null;
      return {
        id: payload.sub,
        phone: String(payload.phone ?? ''),
        nickname: String(payload.nickname ?? ''),
      };
    } catch {
      return null;
    }
  }
}
