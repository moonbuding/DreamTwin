import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { AuthResponse, MeResponse, TwinProjection, UserProfile } from '@dreamtwin/api-types';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from './jwt.service';
import { verifyPassword } from './password';
import type { LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: { profile: true, twin: true },
    });
    if (!user) throw new UnauthorizedException('账号不存在');

    if (user.passwordHash) {
      const ok = dto.password ? verifyPassword(dto.password, user.passwordHash) : false;
      if (!ok) throw new UnauthorizedException('手机号或密码不正确');
    }

    const authUser = { id: user.id, phone: user.phone, nickname: user.nickname };
    return {
      token: await this.jwt.sign(authUser),
      user: authUser,
      profile: (user.profile?.data as unknown as UserProfile) ?? null!,
      twin: (user.twin?.data as unknown as TwinProjection) ?? null!,
    };
  }

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, twin: true },
    });
    if (!user) throw new NotFoundException('用户不存在');
    return {
      user: { id: user.id, phone: user.phone, nickname: user.nickname },
      profile: user.profile?.data as unknown as UserProfile,
      twin: user.twin?.data as unknown as TwinProjection,
    };
  }
}
