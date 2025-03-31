import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  if (!searchParams.token) {
    redirect("/auth/forgot-password");
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <ResetPasswordForm token={searchParams.token} />
    </div>
  );
}
