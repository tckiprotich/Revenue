import { NextResponse } from "next/server";

// app/api/billing-history/route.ts
export async function GET(request: Request) {
    const { userId } = auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    const history = await db.select()
        .from(transactions)
        .where(eq(transactions.user_id, userId))
        .where(service ? 
            like(transactions.additional_details->>'service_name', service) : 
            undefined)
        .orderBy(desc(transactions.transaction_date));

    return NextResponse.json(history);
}