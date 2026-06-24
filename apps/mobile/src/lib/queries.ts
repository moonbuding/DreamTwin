import { useQuery } from '@tanstack/react-query';
import type { PlazaProfile, RelationshipSimulationResult, TodayResponse } from '@dreamtwin/api-types';
import { api } from './api';
import { buildDemoToday, defaultSimulationResult, demoPlazaProfiles } from './demoContent';

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
