import { useQuery } from '@tanstack/react-query';
import type { DreamStory, PlazaProfile, RelationshipSimulationResult, TodayResponse } from '@dreamtwin/api-types';
import { api } from './api';
import { buildDemoToday, defaultSimulationResult, demoPlazaProfiles } from './demoContent';
import { getDreamStory } from './dreamStories';

// 所有查询:优先真实接口,失败则回退到 demo 数据(后端未接入时也能预览)。
export function useToday() {
  return useQuery({
    queryKey: ['today'],
    queryFn: async (): Promise<TodayResponse> => {
      try {
        return (await api.get<TodayResponse>('/today')).data;
      } catch {
        return buildDemoToday();
      }
    },
  });
}

export function usePlaza() {
  return useQuery({
    queryKey: ['plaza'],
    queryFn: async (): Promise<PlazaProfile[]> => {
      try {
        return (await api.get<PlazaProfile[]>('/plaza')).data;
      } catch {
        return demoPlazaProfiles;
      }
    },
  });
}

// 「梦境相遇」短故事:优先后端按人格 AI 生成,失败/离线回退本地固定脚本。
export function useDreamStory(nodeId: string | undefined) {
  return useQuery({
    queryKey: ['story', nodeId],
    enabled: !!nodeId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<DreamStory> => {
      try {
        return (await api.get<DreamStory>(`/story/${nodeId}`)).data;
      } catch {
        return getDreamStory(nodeId);
      }
    },
  });
}

export function useSimulation(nodeId: string | undefined) {
  return useQuery({
    queryKey: ['simulation', nodeId],
    enabled: !!nodeId,
    queryFn: async (): Promise<RelationshipSimulationResult> => {
      try {
        return (await api.get<RelationshipSimulationResult>(`/simulation/${nodeId}`)).data;
      } catch {
        return defaultSimulationResult;
      }
    },
  });
}
