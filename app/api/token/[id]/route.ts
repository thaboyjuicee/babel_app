import { NextResponse } from "next/server";
import { getTokenById } from "@/server/services/babel-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const token = await getTokenById(params.id);

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    return NextResponse.json(token, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch token", detail: String(error) }, { status: 500 });
  }
}
