import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getAuthProvider, getDatabaseProvider, getStorageDriver } from "@/lib/providers";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "bussola",
    module: "platform",
    environment: env.APP_ENV,
    database_provider: getDatabaseProvider(),
    auth_provider: getAuthProvider(),
    storage_driver: getStorageDriver(),
    timestamp: new Date().toISOString(),
  });
}
