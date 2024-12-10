// app/api/pay/route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { payments, serviceAccounts, bills, users, services, meterReadings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@/lib/db/types';

interface PaymentRequest {
  serviceCode: string;
  serviceName: string;
  amount: number;
  calculatedCost: number;
  timestamp: string;
  serviceAccountId?: number;
  // Service specific fields
  usageType?: string;
  reading?: string;
  vehicleType?: string;
  duration?: string;
  plateNumber?: string;
  zone?: string;
  businessType?: string;
  propertyType?: string;
  propertyValue?: string;
  binSize?: string;
  customerType?: string;
}

interface ServiceValidation {
  isValid: boolean;
  missingFields: string[];
}

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Clerk user details
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user exists in our database
    // Fixed query syntax
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    // Create user if not exists
    if (!dbUser) {
      await db.insert(users).values({
        id: userId,
        first_name: user.firstName ?? '',
        last_name: user.lastName ?? '',
        email: user.emailAddresses[0]?.emailAddress ?? '',
        created_at: new Date(),
        updated_at: new Date()
      });
    }



    const body = await request.json() as PaymentRequest;
    console.log('Payment request:', { ...body, userId });

    // Validate required fields
    if (!body.serviceCode || !body.calculatedCost || !body.serviceName) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required payment information',
          missing: ['serviceCode', 'calculatedCost', 'serviceName'].filter(field => !body[field])
        },
        { status: 400 }
      );
    }

    // Get service
    let serviceAccountId = body.serviceAccountId;

    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.service_code, body.serviceCode));

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Service not found' },
        { status: 404 }
      );
    }



    const [serviceAccount] = await db.insert(serviceAccounts).values({
      user_id: userId,
      service_id: service.id,
      service_type: body.serviceCode,
      account_number: `${body.serviceCode}-${userId}-${Date.now()}`,
      status: 'ACTIVE',
      metadata: getServiceSpecificDetails(body)
    }).returning();

    serviceAccountId = serviceAccount.id;

    // Validate service-specific fields
    const serviceValidation = validateServiceFields(body);
    if (!serviceValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing service-specific required fields',
          missing: serviceValidation.missingFields
        },
        { status: 400 }
      );
    }

    // Generate transaction details
    const transactionId = `TRX-${Date.now()}`;
    const processingFee = calculateProcessingFee(body.calculatedCost);
    const totalAmount = body.calculatedCost + processingFee;

    // Get or create service account
   
    if (!serviceAccountId) {
      const [serviceAccount] = await db.insert(serviceAccounts).values({
        user_id: userId,
        service_type: body.serviceCode,
        account_number: `${body.serviceCode}-${userId}-${Date.now()}`,
        status: 'ACTIVE',
        metadata: getServiceSpecificDetails(body)
      }).returning();
      serviceAccountId = serviceAccount.id;
    }

    // Create meter reading for water service
let meterReadingId = null;
if (body.serviceCode === 'WTR') {
  const [meterReading] = await db.insert(meterReadings).values({
    service_account_id: serviceAccountId,
    previous_reading: 0, // First reading
    current_reading: parseFloat(body.reading || '0'),
    consumption: parseFloat(body.reading || '0'), // First reading consumption equals current reading
    reading_date: new Date(),
    reading_type: 'actual',
  }).returning();
  meterReadingId = meterReading.id;
}

    // Create bill record
    const [bill] = await db.insert(bills).values({
      service_account_id: serviceAccountId,
      bill_number: `BILL-${Date.now()}`,
      amount: body.calculatedCost,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      // Only set meter_reading_id for water service, null for others
      meter_reading_id: body.serviceCode === 'WTR' ? meterReadingId : null,
      details: {
        ...getServiceSpecificDetails(body),
        processingFee,
        totalAmount
      }
    }).returning();

    // Create payment record
    const [payment] = await db.insert(payments).values({
      transaction_id: transactionId,
      service_account_id: serviceAccountId,
      bill_id: bill.id,
      amount: body.calculatedCost,
      processing_fee: processingFee,
      total_amount: totalAmount,
      status: 'PENDING',
      payment_method: 'ONLINE',
      payment_details: {
        serviceCode: body.serviceCode,
        serviceName: body.serviceName,
        userId,
        ...getServiceSpecificDetails(body)
      },
      metadata: {
        timestamp: new Date().toISOString(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    }).returning();

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update payment and bill status
    await Promise.all([
      db.update(payments)
        .set({ status: 'COMPLETED' })
        .where(eq(payments.transaction_id, transactionId)),
      db.update(bills)
        .set({ status: 'PAID' })
        .where(eq(bills.id, bill.id))
    ]);

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        transactionId,
        billId: bill.id,
        serviceAccountId,
        amount: body.calculatedCost,
        processingFee,
        totalAmount,
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function validateServiceFields(body: PaymentRequest): ServiceValidation {
  const missingFields: string[] = [];

  switch (body.serviceCode) {
    case 'WTR':
      if (!body.usageType) missingFields.push('usageType');
      if (!body.reading) missingFields.push('reading');
      break;
    case 'PRK':
      if (!body.vehicleType) missingFields.push('vehicleType');
      if (!body.duration) missingFields.push('duration');
      if (!body.plateNumber) missingFields.push('plateNumber');
      if (!body.zone) missingFields.push('zone');
      break;
    case 'BIZ':
      if (!body.businessType) missingFields.push('businessType');
      break;
    case 'LND':
      if (!body.propertyType) missingFields.push('propertyType');
      if (!body.propertyValue) missingFields.push('propertyValue');
      break;
    case 'WST':
      if (!body.customerType) missingFields.push('customerType');
      if (!body.binSize) missingFields.push('binSize');
      break;
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

function getServiceSpecificDetails(body: PaymentRequest) {
  switch (body.serviceCode) {
    case 'WTR':
      return {
        usageType: body.usageType,
        reading: body.reading,
        meterNumber: body.meterNumber
      };
    case 'PRK':
      return {
        vehicleType: body.vehicleType,
        duration: body.duration,
        plateNumber: body.plateNumber,
        zone: body.zone
      };
    case 'BIZ':
      return {
        businessType: body.businessType,
        businessName: body.businessName,
        registrationNumber: body.registrationNumber
      };
    case 'LND':
      return {
        propertyType: body.propertyType,
        propertyValue: body.propertyValue,
        plotNumber: body.plotNumber
      };
    case 'WST':
      return {
        customerType: body.customerType,
        binSize: body.binSize,
        location: body.location
      };
    default:
      return {};
  }
}

function calculateProcessingFee(amount: number): number {
  // 2% processing fee, minimum 50 KSH, maximum 1000 KSH
  return Math.min(Math.max(amount * 0.02, 50), 1000);
}