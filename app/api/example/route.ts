import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

/**
 * Пример API endpoint
 * Демонстрирует работу с различными HTTP методами
 */

// GET /api/example
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";

  const response: ApiResponse<{
    items: string[];
    page: string;
    limit: string;
  }> = {
    status: "success",
    message: "Данные успешно получены",
    data: {
      items: ["item1", "item2", "item3"],
      page,
      limit,
    },
  };

  return NextResponse.json(response, { status: 200 });
}

// POST /api/example
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response: ApiResponse<typeof body> = {
      status: "success",
      message: "Данные успешно созданы",
      data: body,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Ошибка при создании данных",
        data: null,
      },
      { status: 400 }
    );
  }
}

// PUT /api/example
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response: ApiResponse<typeof body> = {
      status: "success",
      message: "Данные успешно обновлены",
      data: body,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Ошибка при обновлении данных",
        data: null,
      },
      { status: 400 }
    );
  }
}

// DELETE /api/example
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  const response: ApiResponse<{ id: string | null }> = {
    status: "success",
    message: "Данные успешно удалены",
    data: { id },
  };

  return NextResponse.json(response, { status: 200 });
}
