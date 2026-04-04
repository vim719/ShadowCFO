import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { approveFix, type ApproveFixParams } from "@/src/api/fixes/approve";

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "SUPABASE_ADMIN_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const params: ApproveFixParams = {
      fixId: body.fixId,
      userId: body.userId,
      requestId: body.requestId,
      consentSignature: body.consentSignature,
      consentChallenge: body.consentChallenge,
      fromAccount: body.fromAccount,
      toAccount: body.toAccount,
      amountCents: body.amountCents,
    };

    const result = await approveFix(supabaseAdmin as any, params);

    return NextResponse.json(
      {
        success: result.success,
        entry: result.entry,
        error: result.error,
      },
      { status: result.status ?? 200 }
    );
  } catch (error) {
    console.error("Approve fix error:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
