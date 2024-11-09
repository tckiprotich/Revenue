import Head from 'next/head';

export default function ThankYou() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Head>
        <title>Thank You</title>
      </Head>
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Received!</h1>
        <p className="text-gray-700 mb-6">Thank you for your payment. Your transaction has been successfully completed.</p>
        <div className="flex justify-center">
          <svg className="w-24 h-24 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m0 0a9 9 0 11-6.364-2.636A9 9 0 0112 21a9 9 0 010-18z"></path>
          </svg>
        </div>
        <a href="/" className="mt-6 inline-block bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition duration-300">Go to Homepage</a>
      </div>
    </div>
  );
}