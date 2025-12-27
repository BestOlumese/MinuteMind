import React, { Suspense } from "react";
import LoginForm from "./_components/LoginForm";

export default function Login() {
  return (
    <div className="w-full max-w-md">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
