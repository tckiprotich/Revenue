import Link from 'next/link';
import {ContentLayout} from '@/components/admin-panel/content-layout';

export default function Home() {
  return (
    <ContentLayout title="Revenue Dashboard">
      <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        <p className="text-lg text-gray-700 mb-4">
          Your dashboard to manage all aspects of the revenue system. View insights, track payments, and more.
        </p>
        <Link href="/admin/dashboard" className="text-blue-600 font-semibold hover:underline hover:text-blue-700 transition">
        
            Go to Admin Dashboard
          
        </Link>
      </div>
    </ContentLayout>
  );
}
