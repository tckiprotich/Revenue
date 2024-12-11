import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { serviceAccounts, waterReadings, payments } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

interface ServiceResponse {
  amount: string | null;
  date: Date | null;
  status: string | null;
  reference: string | null;
  units?: number | null;
  reading?: {
    current: number;
    consumption: number;
    date: Date;
  };
  details?: {
    // Water
    houseNumber?: string;
    usageType?: 'domestic' | 'commercial';
    // Business
    businessType?: string;
    businessNumber?: string;
    // Land
    titleDeed?: string;
    propertyType?: string;
    // Waste
    binSerial?: string;
    binSize?: string;
  } | null;
}

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

    const [lastPayment] = await db
      .select({
        id: payments.id,
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

    let response: ServiceResponse = {
      amount: lastPayment?.amount || null,
      date: lastPayment?.payment_date || null,
      status: lastPayment?.status || null,
      reference: lastPayment?.reference || null,
      details: lastPayment?.details || null
    };

    // Handle water service
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
          },
          details: {
            houseNumber: lastPayment.details?.houseNumber,
            usageType: lastPayment.details?.usageType
          }
        };
      }
    } else {
      // Handle other services
      switch(serviceCode) {
        case 'BIZ':
          response.details = {
            businessType: lastPayment.details?.businessType,
            businessNumber: lastPayment.details?.businessNumber
          };
          break;
        case 'LND':
          response.details = {
            propertyType: lastPayment.details?.propertyType,
            titleDeed: lastPayment.details?.titleDeed
          };
          break;
        case 'WST':
          response.details = {
            binSize: lastPayment.details?.binSize,
            binSerial: lastPayment.details?.binSerial
          };
          break;
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