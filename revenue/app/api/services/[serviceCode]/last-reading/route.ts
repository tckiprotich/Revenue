import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { serviceAccounts, waterReadings, payments } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(
  request: Request,
  context: { params: { serviceCode: string } }
) {
  try {
    const { serviceCode } = context.params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's service account
    const [account] = await db
      .select()
      .from(serviceAccounts)
      .where(
        and(
          eq(serviceAccounts.user_id, userId),
          eq(serviceAccounts.service_type, serviceCode)
        )
      )
      .orderBy(desc(serviceAccounts.created_at))
      .limit(1);

    if (!account) {
      return NextResponse.json({
        success: true,
        data: { lastPayment: null }
      });
    }

    // Get last payment with details
    const [lastPayment] = await db
  .select({
    id: payments.id, // Add id to selection
    amount: payments.amount,
    payment_date: payments.payment_date,
    status: payments.status,
    reference: payments.reference,
    details: payments.details
  })
  .from(payments)
  .where(eq(payments.service_account_id, account.id))
  .orderBy(desc(payments.payment_date))
  .limit(1);

    let response = {
      amount: lastPayment?.amount || null,
      date: lastPayment?.payment_date || null,
      status: lastPayment?.status || null,
      reference: lastPayment?.reference || null,
      units: null
    };

    // Add water readings if water service
    if (serviceCode === 'WTR' && lastPayment?.id) {
      const [reading] = await db
        .select({
          current_reading: waterReadings.current_reading,
          consumption: waterReadings.consumption,
          reading_date: waterReadings.reading_date
        })
        .from(waterReadings)
        .where(
          and(
            eq(waterReadings.service_account_id, account.id),
            eq(waterReadings.payment_id, lastPayment.id)
          )
        )
        .orderBy(desc(waterReadings.reading_date))
        .limit(1);

  if (reading) {
    response = {
      ...response,
      units: reading.consumption ? Number(reading.consumption) : null,
      reading: {
        current: Number(reading.current_reading),
        consumption: Number(reading.consumption),
        date: reading.reading_date
      }
    };
  }
}

    return NextResponse.json({
      success: true,
      data: {
        lastPayment: response
      }
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payment details', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}