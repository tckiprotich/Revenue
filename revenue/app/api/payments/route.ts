// route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { payments, serviceAccounts, services, users, waterReadings } from '@/lib/db/schema';
import { Resend } from 'resend';
import { eq, desc, and } from 'drizzle-orm';
import { EmailTemplate } from '@/components/ui/email';
const IntaSend = require('intasend-node');

const resend = new Resend(process.env.RESEND_API);
const intasend = new IntaSend(
  'ISPubKey_test_eda9a8be-bbc9-4f5d-a0ef-54a85960789c',
  'ISSecretKey_test_62c9506e-2eb1-4432-8639-b3502a14d9a6',
  true
);
interface ServiceData {
  usageType: string;
  reading?: string;
  calculatedCost: number;
  serviceCode: string;
  serviceName: string;
  timestamp: string;
  details?: {
    // Water
    houseNumber?: string;
    // Business
    businessType?: string;
    businessNumber?: string;
    // Land
    titleDeed?: string;
    propertyType?: string;
    // Waste
    binSerial?: string;
    binSize?: string;
  };
}

interface EmailTemplateProps {
  firstName: string;
  email: string;
  services: ServiceData;
}

interface PaymentRequest {
  serviceCode: string;
  amount: number;
  details: {
    reading?: number;    
    consumption?: number;
    usageType?: 'domestic' | 'commercial';
    houseNumber?: string;
    businessType?: 'small_enterprise' | 'medium_enterprise' | 'large_enterprise';
    businessNumber?: string;
    propertyType?: 'residential' | 'commercial' | 'industrial';
    propertyValue?: number;
    titleDeed?: string;
    binSize?: 'small_bin' | 'medium_bin' | 'large_bin';
    customerType?: 'residential' | 'commercial';
    binSerial?: string;
    vehicleType?: 'car' | 'lorry' | 'motorcycle';
    duration?: 'hourly' | 'daily' | 'monthly';
    zone?: 'CBD' | 'RESIDENTIAL' | 'INDUSTRIAL';
  };
}

// Helper function to ensure user exists
async function ensureUser(userId: string, clerkUser: any) {
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    [user] = await db.insert(users)
      .values({
        id: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        name: `${clerkUser.firstName} ${clerkUser.lastName}`,
        phone: clerkUser.phoneNumbers[0]?.phoneNumber || null
      })
      .returning();
  }
  return user;
}

// Helper function to get or create service account
async function getServiceAccount(userId: string, serviceCode: string, accountNumber: string) {
  let [serviceAccount] = await db
    .select()
    .from(serviceAccounts)
    .where(
      and(
        eq(serviceAccounts.user_id, userId),
        eq(serviceAccounts.service_type, serviceCode)
      )
    );

  if (!serviceAccount) {
    [serviceAccount] = await db.insert(serviceAccounts)
      .values({
        user_id: userId,
        service_type: serviceCode,
        account_number: accountNumber,
        status: 'PENDING'
      })
      .returning();
  }
  return serviceAccount;
}

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

    // Ensure user exists in our database
    await ensureUser(userId, clerkUser);

    const rawBody = await request.json();
    console.log('Payment request:', rawBody);
    
    const body: PaymentRequest = {
      serviceCode: rawBody.serviceCode,
      amount: rawBody.calculatedCost,
      details: {
        reading: rawBody.reading,
        consumption: rawBody.consumption,
        usageType: rawBody.usageType,
        houseNumber: rawBody.houseNumber,
        businessType: rawBody.businessType,
        businessNumber: rawBody.businessNumber,
        titleDeed: rawBody.titleDeed,
        binSerial: rawBody.binSerial,
      }
    };

    const transactionId = `${body.serviceCode}-${Date.now()}`;

    // Process payment through IntaSend
    const paymentResult = await intasend.collection().charge({
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      phone: clerkUser.phoneNumbers[0]?.phoneNumber,
      amount: body.amount,
      currency: 'KES',
      api_ref: transactionId
    });

    // Get or create service account
    const serviceAccount = await getServiceAccount(userId, body.serviceCode, transactionId);

    // Create payment record
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

    // Handle water service specific logic
    if (body.serviceCode === 'WTR' && body.details.reading) {
      const currentReading = Number(body.details.reading);
      
      // Get last reading
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

      // Create water reading record
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

    // Update email sending section
try {
  const emailData: EmailTemplateProps = {
    firstName: clerkUser.firstName || 'Valued Customer', // Provide fallback
    email: clerkUser.emailAddresses[0].emailAddress,
    services: {
      usageType: body.details.usageType || 'standard',
      reading: body.details.reading?.toString(),
      calculatedCost: body.amount,
      serviceCode: body.serviceCode,
      serviceName: rawBody.serviceName,
      timestamp: new Date().toISOString(),
      details: {
        // Water
        houseNumber: body.details.houseNumber,
        // Business
        businessType: body.details.businessType,
        businessNumber: body.details.businessNumber,
        // Land
        titleDeed: body.details.titleDeed,
        propertyType: body.details.propertyType,
        // Waste
        binSerial: body.details.binSerial,
        binSize: body.details.binSize
      }
    }
  };

  const { data, error } = await resend.emails.send({
    from: 'Revenue System <collins@bistretech.com>',
    to: [emailData.email],
    subject: `Payment Confirmation - ${emailData.services.serviceName}`,
    react: EmailTemplate(emailData)
  });
} catch (error) {
  console.error('Email error:', error);
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