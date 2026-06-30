import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "bussola",
    module: "learning",
    environment: env.APP_ENV,
    timestamp: new Date().toISOString(),
  });
}
