import React, { Suspense } from "react";
import OTPForm from "./_components/OTPForm";
import { redirect } from "next/navigation";

export default async function OTP({
  searchParams,
}: {
  searchParams: { email: string };
}) {
  const { email } = await searchParams;
  if (!email) {
    redirect("/login");
  }

  return (
    <div className="w-full max-w-md">
      <Suspense>
        <OTPForm email={email} />
      </Suspense>
    </div>
  );
}
