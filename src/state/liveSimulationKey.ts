export function liveSimulationResultKey(nodeId: string, roamingSceneId?: string | null): string {
  return roamingSceneId ? `${nodeId}:${roamingSceneId}` : nodeId;
}
