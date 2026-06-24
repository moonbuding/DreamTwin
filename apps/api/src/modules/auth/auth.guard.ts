import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from './auth.types';
import { JwtService } from './jwt.service';

function extractUser(request: Request, jwt: JwtService): Promise<AuthenticatedUser | null> {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return Promise.resolve(null);
  return jwt.verify(header.slice('Bearer '.length).trim());
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser | null }>();
    const user = await extractUser(request, this.jwt);
    if (!user) throw new UnauthorizedException('未登录或登录已过期');
    request.user = user;
    return true;
  }
}

/** 可选鉴权:带 token 则解析出 user,不带也放行(user=null)。 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser | null }>();
    request.user = await extractUser(request, this.jwt);
    return true;
  }
}
