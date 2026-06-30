import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthResponse, MeResponse, TwinProjection, UserProfile } from '@dreamtwin/api-types';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from './jwt.service';
import { hashPassword, verifyPassword } from './password';
import type { LoginDto, ProfileTwinDto, RegisterDto } from './dto';
import { buildDemoFriendRows, buildDemoNodeRows, buildDemoProfile, buildTwinFromProfile } from './demo-data';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const phone = dto.phone.trim();
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { profile: true, twin: true },
    });
    if (!user) throw new UnauthorizedException('账号不存在');

    if (user.passwordHash) {
      const ok = dto.password ? verifyPassword(dto.password, user.passwordHash) : false;
      if (!ok) throw new UnauthorizedException('手机号或密码不正确');
    }

    await this.ensureDemoData(user.id, user.nickname);
    return this.buildAuthResponse(user.id);
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const phone = dto.phone.trim();
    const nickname = dto.nickname?.trim() || `梦友${phone.slice(-4)}`;
    const exists = await this.prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (exists) throw new ConflictException('该手机号已注册,请直接登录');

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { phone, nickname, passwordHash: hashPassword(dto.password) },
      });
      const profile = buildDemoProfile(created.id, nickname);
      const twin = buildTwinFromProfile(profile);

      await tx.profile.create({ data: { userId: created.id, data: profile as object } });
      await tx.twin.create({ data: { userId: created.id, data: twin as object } });
      await tx.friend.createMany({ data: buildDemoFriendRows(created.id) });
      await tx.dreamNode.createMany({ data: buildDemoNodeRows(created.id) });
      return created;
    });

    return this.buildAuthResponse(user.id);
  }

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    await this.ensureDemoData(user.id, user.nickname);
    const [profile, twin] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId: user.id } }),
      this.prisma.twin.findUnique({ where: { userId: user.id } }),
    ]);
    return {
      user: { id: user.id, phone: user.phone, nickname: user.nickname },
      profile: profile?.data as unknown as UserProfile,
      twin: twin?.data as unknown as TwinProjection,
    };
  }

  async saveProfileTwin(userId: string, dto: ProfileTwinDto): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const profile = { ...dto.profile, id: user.id };
    const twin = { ...dto.twin, id: dto.twin.id || `twin-${user.id}` };
    const nickname = profile.nickname?.trim() || user.nickname;

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { nickname } }),
      this.prisma.profile.upsert({
        where: { userId: user.id },
        update: { data: profile as object },
        create: { userId: user.id, data: profile as object },
      }),
      this.prisma.twin.upsert({
        where: { userId: user.id },
        update: { data: twin as object },
        create: { userId: user.id, data: twin as object },
      }),
    ]);

    await this.ensureDemoData(user.id, nickname);
    return this.getMe(user.id);
  }

  private async buildAuthResponse(userId: string): Promise<AuthResponse> {
    const me = await this.getMe(userId);
    return {
      token: await this.jwt.sign(me.user),
      user: me.user,
      profile: me.profile,
      twin: me.twin,
    };
  }

  private async ensureDemoData(userId: string, nickname: string): Promise<void> {
    const profile = buildDemoProfile(userId, nickname);
    const twin = buildTwinFromProfile(profile);
    const [profileRow, twinRow, nodeCount, friendCount] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.twin.findUnique({ where: { userId } }),
      this.prisma.dreamNode.count({ where: { userId } }),
      this.prisma.friend.count({ where: { userId } }),
    ]);

    await this.prisma.$transaction(async (tx) => {
      if (!profileRow) await this.upsertProfile(tx, userId, profile);
      if (!twinRow) await this.upsertTwin(tx, userId, twin);
      if (friendCount === 0) await tx.friend.createMany({ data: buildDemoFriendRows(userId) });
      if (nodeCount === 0) await tx.dreamNode.createMany({ data: buildDemoNodeRows(userId) });
    });
  }

  private async upsertProfile(db: DbClient, userId: string, profile: UserProfile): Promise<void> {
    await db.profile.upsert({
      where: { userId },
      update: { data: profile as object },
      create: { userId, data: profile as object },
    });
  }

  private async upsertTwin(db: DbClient, userId: string, twin: TwinProjection): Promise<void> {
    await db.twin.upsert({
      where: { userId },
      update: { data: twin as object },
      create: { userId, data: twin as object },
    });
  }
}
