import { NextRequest, NextResponse } from "next/server";

interface FixQueueItem {
  id: string;
  userId: string;
  fixId: string;
  why: string;
  how: string;
  when: string;
  where: string;
  confidence: number;
  disclaimer: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const fixQueue: Map<string, FixQueueItem> = new Map();

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  const items = Array.from(fixQueue.values()).filter(
    (item) => item.userId === userId && item.status === "pending"
  );

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const item: FixQueueItem = {
      id: crypto.randomUUID(),
      userId: body.userId,
      fixId: body.fixId,
      why: body.why,
      how: body.how,
      when: body.when,
      where: body.where,
      confidence: body.confidence ?? 0.5,
      disclaimer: body.disclaimer,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    fixQueue.set(item.id, item);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Create fix queue item error:", error);
    return NextResponse.json(
      { error: "Failed to create fix queue item" },
      { status: 500 }
    );
  }
}
