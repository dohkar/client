import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

/**
 * Health check endpoint
 * GET /api/health
 */
export async function GET() {
  const response: ApiResponse<{ status: string; timestamp: string }> = {
    status: "success",
    message: "API работает корректно",
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(response, { status: 200 });
}
