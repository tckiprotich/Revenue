// route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { payments, serviceAccounts, services, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
const IntaSend = require('intasend-node');


const resend = new Resend(process.env.RESEND_API);
let intasend = new IntaSend(
    'ISPubKey_test_eda9a8be-bbc9-4f5d-a0ef-54a85960789c',
    'ISSecretKey_test_62c9506e-2eb1-4432-8639-b3502a14d9a6',
    true,
);

interface PaymentRequest {
  serviceCode: string;  // WTR, BIZ, LND, WST, PRK
  amount: number;
  details: {
    // Water
    reading?: number;
    consumption?: number;
    // Business
    businessType?: 'small_enterprise' | 'medium_enterprise' | 'large_enterprise';
    // Land
    propertyType?: 'residential' | 'commercial' | 'industrial';
    propertyValue?: number;
    // Waste
    binSize?: 'small_bin' | 'medium_bin' | 'large_bin';
    customerType?: 'residential' | 'commercial';
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
    const body: PaymentRequest = {
      serviceCode: rawBody.serviceCode,
      amount: rawBody.calculatedCost,
      details: {
        businessType: rawBody.businessType,
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