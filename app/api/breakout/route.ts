import { NextRequest, NextResponse } from "next/server";
import { getBreakoutTokens } from "@/server/services/babel-service";
import { AGE_BUCKETS, type AgeBucket } from "@/types/babel";

function getBucketFromRequest(request: NextRequest): AgeBucket {
  const bucket = request.nextUrl.searchParams.get("bucket") as AgeBucket | null;
  if (bucket && AGE_BUCKETS.some((item) => item.key === bucket)) {
    return bucket;
  }
  return "1h";
}

export async function GET(request: NextRequest) {
  try {
    const bucket = getBucketFromRequest(request);
    const data = await getBreakoutTokens(bucket);
    return NextResponse.json({ bucket, tokens: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch breakout", detail: String(error) }, { status: 500 });
  }
}
