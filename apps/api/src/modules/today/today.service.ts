import { Injectable } from '@nestjs/common';
import type { DreamNode, FriendProfile, TodayResponse } from '@dreamtwin/api-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TodayService {
  constructor(private readonly prisma: PrismaService) {}

  async getToday(userId: string | null): Promise<TodayResponse> {
    // 未登录时退回到种子 demo 账号,让 /today 也能返回内容(对齐 legacy 本地 demo)。
    const user = userId
      ? await this.prisma.user.findUnique({ where: { id: userId }, include: { twin: true } })
      : await this.prisma.user.findFirst({ include: { twin: true } });

    if (!user) {
      return { greetingName: '你', nodes: [], friends: [], newDreamCount: 0, waitingCount: 0, bothEnteredCount: 0 };
    }

    const [nodeRows, friendRows] = await Promise.all([
      this.prisma.dreamNode.findMany({ where: { userId: user.id } }),
      this.prisma.friend.findMany({ where: { userId: user.id } }),
    ]);

    const nodes: DreamNode[] = nodeRows.map((node) => ({
      id: node.id,
      title: node.title,
      status: node.status as DreamNode['status'],
      simulationId: node.simulationId,
      entryMode: node.entryMode as DreamNode['entryMode'],
      x: node.x,
      y: node.y,
      intensity: node.intensity,
    }));

    const friends: FriendProfile[] = friendRows.map((friend) => ({
      id: friend.id,
      name: friend.name,
      relationLabel: friend.relationLabel,
      presence: friend.presence,
      keywords: friend.keywords,
    }));

    const overnight = nodes.filter((node) => node.entryMode === 'overnight_discovery');
    const newDreamCount = overnight.filter((node) => node.status === 'unviewed').length || overnight.length;
    const waitingCount = nodes.filter((node) => node.status === 'waiting').length;
    const bothEnteredCount = nodes.filter(
      (node) => node.status === 'both_entered' || node.status === 'opened' || node.status === 'in_chat',
    ).length;

    return {
      greetingName: user.nickname,
      nodes,
      friends,
      newDreamCount,
      waitingCount,
      bothEnteredCount,
    };
  }
}
