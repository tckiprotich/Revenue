// route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { payments, serviceAccounts, services, users, waterReadings } from '@/lib/db/schema';
// import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
const IntaSend = require('intasend-node');
import { eq, desc, and } from 'drizzle-orm';


const resend = new Resend(process.env.RESEND_API);
let intasend = new IntaSend(
    'ISPubKey_test_eda9a8be-bbc9-4f5d-a0ef-54a85960789c',
    'ISSecretKey_test_62c9506e-2eb1-4432-8639-b3502a14d9a6',
    true,
);

interface PaymentRequest {
  serviceCode: string;
  amount: number;
  details: {
    // Water
    reading?: number;    
    consumption?: number;
    usageType?: 'domestic' | 'commercial';
    houseNumber?: string;
    // Business
    businessType?: 'small_enterprise' | 'medium_enterprise' | 'large_enterprise';
    businessNumber?: string; // Add this
    // Land
    propertyType?: 'residential' | 'commercial' | 'industrial';
    propertyValue?: number;
    titleDeed?: string; // Add this
    // Waste
    binSize?: 'small_bin' | 'medium_bin' | 'large_bin';
    customerType?: 'residential' | 'commercial';
    binSerial?: string; // Add this
    // Parking
    vehicleType?: 'car' | 'lorry' | 'motorcycle';
    duration?: 'hourly' | 'daily' | 'monthly';
    zone?: 'CBD' | 'RESIDENTIAL' | 'INDUSTRIAL';
  };
}

// route.ts
// route.ts
// route.ts
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const rawBody = await request.json();
    console.log('Payment request:', rawBody);
    
const body: PaymentRequest = {
  serviceCode: rawBody.serviceCode,
  amount: rawBody.calculatedCost,
  details: {
    // Water details
    reading: rawBody.reading,
    consumption: rawBody.consumption,
    usageType: rawBody.usageType,
    houseNumber: rawBody.houseNumber,
    // Business details
    businessType: rawBody.businessType,
    businessNumber: rawBody.businessNumber,
    // Land details
    titleDeed: rawBody.titleDeed,
    // Waste details
    binSerial: rawBody.binSerial,
  }
};

    const transactionId = `${body.serviceCode}-${Date.now()}`;

    const paymentResult = await intasend.collection().charge({
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      phone: clerkUser.phoneNumbers[0]?.phoneNumber,
      amount: body.amount,
      currency: 'KES',
      api_ref: transactionId
    });

    const [serviceAccount] = await db.insert(serviceAccounts)
      .values({
        user_id: userId,
        service_type: body.serviceCode,
        account_number: transactionId,
        status: 'PENDING'
      })
      .returning();

    const [payment] = await db.insert(payments)
      .values({
        service_account_id: Number(serviceAccount.id),
        amount: body.amount.toString(),
        status: 'PENDING',
        payment_date: new Date(),
        details: body.details,
        reference: transactionId
      })
      .returning();

      // Add water readings if water service
      if (body.serviceCode === 'WTR') {
        const currentReading = Number(rawBody.reading);
        // Get last reading to calculate consumption
        const [lastReading] = await db
          .select({
            current_reading: waterReadings.current_reading,
          })
          .from(waterReadings)
          .where(eq(waterReadings.service_account_id, serviceAccount.id))
          .orderBy(desc(waterReadings.reading_date))
          .limit(1);
      
        const consumption = lastReading 
          ? currentReading - Number(lastReading.current_reading)
          : currentReading;


          const body: PaymentRequest = {
            serviceCode: rawBody.serviceCode,
            amount: rawBody.calculatedCost,
            details: {
              reading: Number(rawBody.reading),
              usageType: rawBody.usageType,
              houseNumber: rawBody.houseNumber,
            }
          };
      
        await db.insert(waterReadings)
          .values({
            current_reading: currentReading.toString(),
            consumption: consumption.toString(),
            service_account_id: serviceAccount.id,
            payment_id: payment.id,
            reading_date: new Date(),
          })
          .returning();
      }

    return NextResponse.json({
      success: true,
      data: {
        ...paymentResult,
        serviceAccountId: serviceAccount.id,
        paymentId: payment.id,
        serviceType: body.serviceCode
      }
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Payment failed', error: error.message },
      { status: 500 }
    );
  }
}