interface ServiceRecord {
    id: number;
    service_account_id: number;
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    payment_date: Date;
    metadata: Record<string, any>;
  }
  
  interface WaterRecord extends ServiceRecord {
    current_reading: number;
    previous_reading: number;
    consumption: number;
    rate_per_unit: number;
  }
  
  interface ParkingRecord extends ServiceRecord {
    vehicle_type: string;
    plate_number: string;
    duration: number;
    zone: string;
    rate: number;
  }

  import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { 
  payments, 
  serviceAccounts, 
  bills, 
  users, 
  services, 
  meterReadings,
  parkingRecords,
  waterRecords 
} from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Resend } from 'resend';
import { EmailTemplate } from '@/components/ui/email';
const IntaSend = require('intasend-node');


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

const resend = new Resend(process.env.RESEND_API);
let intasend = new IntaSend(
    'ISPubKey_test_eda9a8be-bbc9-4f5d-a0ef-54a85960789c',
    'ISSecretKey_test_62c9506e-2eb1-4432-8639-b3502a14d9a6',
    true,
);

async function saveWaterRecord(
    serviceAccountId: number,
    reading: number,
    amount: number
  ): Promise<void> {
    const [previousReading] = await db
      .select()
      .from(meterReadings)
      .where(eq(meterReadings.service_account_id, serviceAccountId))
      .orderBy(desc(meterReadings.reading_date))
      .limit(1);
  
    const consumption = previousReading 
      ? reading - previousReading.current_reading 
      : 0;
  
    await db.transaction(async (tx) => {
      // Save meter reading
      await tx.insert(meterReadings).values({
        service_account_id: serviceAccountId,
        current_reading: reading,
        previous_reading: previousReading?.current_reading || 0,
        consumption,
        reading_date: new Date(),
        amount_charged: amount,
        rate_per_unit: amount / (consumption || 1)
      });
  
      // Save payment record
      await tx.insert(payments).values({
        service_account_id: serviceAccountId,
        amount,
        payment_date: new Date(),
        status: 'COMPLETED',
        metadata: {
          reading,
          consumption,
          previous_reading: previousReading?.current_reading || 0
        }
      });
    });
  }
  
  async function saveParkingRecord(
    serviceAccountId: number,
    data: PaymentRequest,
    amount: number
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.insert(parkingRecords).values({
        service_account_id: serviceAccountId,
        vehicle_type: data.vehicleType!,
        plate_number: data.plateNumber!,
        duration: parseInt(data.duration!),
        zone: data.zone!,
        amount,
        rate: amount / parseInt(data.duration!),
        payment_date: new Date(),
        status: 'COMPLETED'
      });
  
      await tx.insert(payments).values({
        service_account_id: serviceAccountId,
        amount,
        payment_date: new Date(),
        status: 'COMPLETED',
        metadata: {
          vehicle_type: data.vehicleType,
          plate_number: data.plateNumber,
          duration: data.duration,
          zone: data.zone
        }
      });
    });
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
  
      const user = await currentUser();
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' }, 
          { status: 404 }
        );
      }
  
      // Ensure user exists in DB
      await db.transaction(async (tx) => {
        const [dbUser] = await tx
          .select()
          .from(users)
          .where(eq(users.id, userId));
  
        if (!dbUser) {
          await tx.insert(users).values({
            id: userId,
            first_name: user.firstName ?? '',
            last_name: user.lastName ?? '',
            email: user.emailAddresses[0]?.emailAddress ?? '',
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      });
  
      const body = await request.json() as PaymentRequest;
      
      // Validate request
      const validation = validateServiceFields(body);
      if (!validation.isValid) {
        return NextResponse.json({
          success: false,
          message: 'Missing required fields',
          missing: validation.missingFields
        }, { status: 400 });
      }
  
      // Process payment through IntaSend
      const transactionId = `TRX-${Date.now()}`;
      const processingFee = calculateProcessingFee(body.calculatedCost);
      const totalAmount = body.calculatedCost + processingFee;
  
      // Create or get service account
      let serviceAccountId = body.serviceAccountId;
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
  
      // Process payment and save records
      const paymentResult = await intasend.collection().charge({
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.emailAddresses[0]?.emailAddress,
        amount: totalAmount,
        currency: 'KES',
        api_ref: transactionId
      });
  
      // Save service-specific records
      await db.transaction(async (tx) => {
        if (body.serviceCode === 'WTR' && body.reading) {
          await saveWaterRecord(
            serviceAccountId!,
            parseFloat(body.reading),
            body.calculatedCost
          );
        } else if (body.serviceCode === 'PRK') {
          await saveParkingRecord(
            serviceAccountId!,
            body,
            body.calculatedCost
          );
        } else {
          // Generic payment record
          await tx.insert(payments).values({
            service_account_id: serviceAccountId!,
            amount: body.calculatedCost,
            payment_date: new Date(),
            status: 'COMPLETED',
            metadata: getServiceSpecificDetails(body)
          });
        }
      });
  
      // Send email receipt
      await sendEmail(
        user.emailAddresses[0]?.emailAddress!, 
        user.firstName!, 
        body
      );
  
      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          transactionId,
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
      return handleError(error);
    }
  }



function handleError(error) {
    const errorMessage = error instanceof Buffer ? error.toString() : error.message;
    return NextResponse.json({ success: false, message: 'Failed to process payment', error: errorMessage }, { status: 500 });
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
    
    return { isValid: missingFields.length === 0, missingFields };
}

function getServiceSpecificDetails(body: PaymentRequest) {
    switch (body.serviceCode) {
        case 'WTR':
            return { usageType: body.usageType, reading: body.reading };
        
        case 'PRK':
            return { vehicleType: body.vehicleType, duration: body.duration, plateNumber: body.plateNumber, zone: body.zone };
        
        case 'BIZ':
            return { businessType: body.businessType };
        
        case 'LND':
            return { propertyType: body.propertyType, propertyValue: body.propertyValue };
        
        case 'WST':
            return { customerType: body.customerType, binSize: body.binSize };
        
        default:
            return {};
    }
}

function calculateProcessingFee(amount: number): number {
    // 2% processing fee, minimum 50 KSH, maximum 1000 KSH
    return Math.min(Math.max(amount * 0.02, 50), 1000);
}

const sendEmail = async (email:string, first_name:string, services:any) => {
    try {
        console.log('Sending email to:', email, first_name, services);
        const { data, error } = await resend.emails.send({
            from:'Revenue <collins@bistretech.com>',
            to : email,
            subject : 'Your Receipt',
            react : EmailTemplate({ firstName:first_name,email ,services}),
         });
         console.log('Email sent:',data);
         if (error) {
             throw new Error(error);
         }
         return data; 
     } catch (error) {
         console.error('Email sending failed:', error);
         throw new Error('Email sending failed');
     }
}