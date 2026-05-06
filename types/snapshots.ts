export interface SnapshotStatus {
  pudds: { syncedAt: string | null; trialCount: number };
  extractor: { syncedAt: string | null; specCount: number };
}
