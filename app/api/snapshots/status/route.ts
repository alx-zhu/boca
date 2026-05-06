import { createClient } from "@/lib/supabase/server";
import type { SnapshotStatus } from "@/types/snapshots";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [puddsRes, extractorRes] = await Promise.all([
    supabase
      .from("snapshots")
      .select("created_at, data")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("extractor-snapshots")
      .select("created_at, data")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const trialCount = countItems(puddsRes.data?.data?.trials);
  const specCount = countItems(extractorRes.data?.data?.specs);

  const status: SnapshotStatus = {
    pudds: {
      syncedAt: puddsRes.data?.created_at ?? null,
      trialCount,
    },
    extractor: {
      syncedAt: extractorRes.data?.created_at ?? null,
      specCount,
    },
  };

  return Response.json(status);
}

function countItems(raw: unknown): number {
  if (typeof raw !== "string") return 0;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
