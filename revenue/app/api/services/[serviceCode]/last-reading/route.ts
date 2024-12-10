// app/api/services/[serviceCode]/last-reading/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/drizzle';
import { serviceAccounts, meterReadings, payments } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { serviceCode: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's service account with the specific service code
    const [account] = await db
      .select()
      .from(serviceAccounts)
      .where(
        and(
          eq(serviceAccounts.user_id, userId),
          eq(serviceAccounts.service_type, params.serviceCode)
        )
      )
      .orderBy(desc(serviceAccounts.created_at))
      .limit(1);

    if (!account) {
      return NextResponse.json({ 
        success: true,
        data: { lastCharge: null, lastReading: null } 
      });
    }

    // Get last successful payment
    const [lastPayment] = await db
      .select({
        amount: payments.amount
      })
      .from(payments)
      .where(
        and(
          eq(payments.service_account_id, account.id),
          eq(payments.status, 'COMPLETED')
        )
      )
      .orderBy(desc(payments.payment_date))
      .limit(1);

    // Get last meter reading if water service
    let lastReading = null;
    if (params.serviceCode === 'WTR') {
      const [reading] = await db
        .select({
          current_reading: meterReadings.current_reading
        })
        .from(meterReadings)
        .where(eq(meterReadings.service_account_id, account.id))
        .orderBy(desc(meterReadings.reading_date))
        .limit(1);
      
      lastReading = reading?.current_reading || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        lastCharge: lastPayment?.amount || null,
        lastReading
      }
    });

  } catch (error) {
    console.error('Error fetching service details:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch service details' },
      { status: 500 }
    );
  }
}