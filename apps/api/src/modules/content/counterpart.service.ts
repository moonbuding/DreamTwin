import { Injectable, Logger } from '@nestjs/common';
import type { RelationshipCounterpartProfile } from '@dreamtwin/api-types';
import { PrismaService } from '../../prisma/prisma.service';
import { findPlazaProfile } from './plaza.data';

// 对手取数(阶段3b):按 DreamNode 上的 counterpartKind/counterpartId 解析「梦中人」卡片。
// 当前从既有的薄数据源(Friend 行 / 广场人物)映射成 RelationshipCounterpartProfile;
// 心理学派生层(psychology)留待阶段4 的派生器补全 —— 此处缺失即留白、不编造。
@Injectable()
export class CounterpartService {
  private readonly logger = new Logger(CounterpartService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 解析某节点的「梦中人」卡片;无对手 / 解析失败 / 异常 → null(调用方按留白处理,不阻断故事/预演)。
  async resolveForNode(
    nodeId: string,
    userId: string | null,
  ): Promise<RelationshipCounterpartProfile | null> {
    try {
      const node = await this.prisma.dreamNode.findFirst({
        where: { id: nodeId, ...(userId ? { userId } : {}) },
      });
      if (!node?.counterpartKind || !node.counterpartId) return null;

      if (node.counterpartKind === 'friend') {
        return await this.resolveFriend(node.counterpartId, node.userId);
      }
      if (node.counterpartKind === 'plaza') {
        return this.resolvePlaza(node.counterpartId);
      }
      return null;
    } catch (error) {
      this.logger.warn(`Counterpart resolve failed for ${nodeId}: ${(error as Error).message}; leaving TA blank.`);
      return null;
    }
  }

  private async resolveFriend(
    friendId: string,
    ownerUserId: string,
  ): Promise<RelationshipCounterpartProfile | null> {
    const friend = await this.prisma.friend.findFirst({
      where: { id: friendId, userId: ownerUserId },
    });
    if (!friend) return null;
    return {
      name: friend.name,
      relationLabel: friend.relationLabel,
      personalityKeywords: friend.keywords,
      interests: [],
    };
  }

  private resolvePlaza(plazaId: string): RelationshipCounterpartProfile | null {
    const plaza = findPlazaProfile(plazaId);
    if (!plaza) return null;
    return {
      name: plaza.name,
      personalityKeywords: plaza.keywords,
      interests: [],
      // tagline 是一句行为/沟通自述,作为行为信号喂入(而非编造的既定事实)。
      optionalSignals: plaza.tagline ? [plaza.tagline] : [],
    };
  }
}
