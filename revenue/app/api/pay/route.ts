const IntaSend = require('intasend-node');
import { NextResponse } from "next/server";

let intasend = new IntaSend(
    'ISPubKey_test_eda9a8be-bbc9-4f5d-a0ef-54a85960789c',
    'ISSecretKey_test_62c9506e-2eb1-4432-8639-b3502a14d9a6',
    true,
);

export async function POST(request: Request) {
    const { first_name, last_name, email, amount } = await request.json();
    // console.log('Charge request:', { first_name, last_name, email, amount });

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

        // console.log(response);

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