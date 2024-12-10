const IntaSend = require('intasend-node');
import { NextResponse } from "next/server";
import { EmailTemplate } from '@/components/ui/email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API);

let intasend = new IntaSend(
    'ISPubKey_test_eda9a8be-bbc9-4f5d-a0ef-54a85960789c',
    'ISSecretKey_test_62c9506e-2eb1-4432-8639-b3502a14d9a6',
    true,
);

export async function POST(request: Request) {
    const requestBody = await request.json();
    console.log('Charge request:', requestBody);

    try {
        const response = await intasend.collection().charge({
            first_name,
            last_name,
            email,
            host: 'http://127.0.0.1:3000',
            amount,
            currency: 'KES',
            api_ref: 'test'
        });

        // send email
        await sendEmail(email, first_name, services);

    

        return NextResponse.json(response);

    } catch (error: any) {
        const errorMessage = error instanceof Buffer ? error.toString() : error.message;
        console.error('Charge error:', errorMessage);

       
        return new NextResponse(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}


const sendEmail = async (email: string, first_name: string, services) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Revenue <collins@bistretech.com>',
            to: email,
            subject: 'Your Receipt',
            react: EmailTemplate({
                firstName: first_name,
                email: email,
                services: services
            }),
        });

        console.log('Email sent:');

        if (error) {
            return Response.json({ error }, { status: 500 });
        }

        return Response.json(data);
    } catch (error) {
        return Response.json({ error }, { status: 500 });
    }
}