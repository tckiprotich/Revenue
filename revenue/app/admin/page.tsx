import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useAuth, RedirectToSignIn, useUser } from '@clerk/nextjs';

export default function Page() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const email = user.emailAddresses[0].emailAddress;

  if (email !== 'admin@revenue.ke') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700">Admins have access only.</p>
        </div>
      </div>
    );
  }

  return (
    <ContentLayout title="Test">
      <div>Test</div>
    </ContentLayout>
  );
}