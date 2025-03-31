import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";

export default async function SignInPage() {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <AuthForm />
    </div>
  );
}
