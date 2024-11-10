import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-b from-[#f5f7fa] to-[#c3cfe2] sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-4 tracking-tight">
          Revenue Dashboard
        </h1>
        <p className="text-xl text-gray-600 max-w-md mx-auto">
          Pay for Municipal services online.
        </p>
      </div>

    

      {/* Button Section */}
      <div className="flex gap-6 mt-12">
        <Link href="/pay" className="bg-blue-500 text-white py-3 px-8 rounded-full font-semibold text-lg shadow-md hover:bg-blue-600 transition transform hover:scale-105">
         
            Pay Now
          
        </Link>
        <Link href="/admin" className="bg-gray-700 text-white py-3 px-8 rounded-full font-semibold text-lg shadow-md hover:bg-gray-800 transition transform hover:scale-105">
          
            Go to Admin
          
        </Link>
      </div>
    </div>
  );
}
