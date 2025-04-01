import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

// In Next.js 15, searchParams must be a Promise for production builds
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  // Resolve the searchParams Promise
  const resolvedSearchParams = await searchParams;

  if (!resolvedSearchParams.token) {
    redirect("/auth/forgot-password");
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <ResetPasswordForm token={resolvedSearchParams.token} />
    </div>
  );
}
