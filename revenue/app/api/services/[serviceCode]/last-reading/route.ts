// app/api/services/[serviceCode]/last-reading/route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { serviceAccounts, meterReadings } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

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

    // Get user's service account
    const [account] = await db
      .select()
      .from(serviceAccounts)
      .where(eq(serviceAccounts.service_type, params.serviceCode))
      .where(eq(serviceAccounts.user_id, userId));

    if (!account) {
      return NextResponse.json({ 
        success: true,
        data: { lastCharge: null, lastReading: null } 
      });
    }

    // Get last meter reading if water service
    let lastReading = null;
    if (params.serviceCode === 'WTR') {
      const [reading] = await db
        .select()
        .from(meterReadings)
        .where(eq(meterReadings.service_account_id, account.id))
        .orderBy(desc(meterReadings.reading_date))
        .limit(1);
      
      lastReading = reading?.current_reading || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        lastCharge: account.last_charge,
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