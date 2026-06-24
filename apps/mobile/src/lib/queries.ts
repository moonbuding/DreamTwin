import { useQuery } from '@tanstack/react-query';
import type { TodayResponse } from '@dreamtwin/api-types';
import { api } from './api';
import { buildDemoToday } from './demoContent';

// 今日动态:优先真实接口,失败则回退到 demo 数据(后端未接入时也能预览)。
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
