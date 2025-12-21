"use client";

import { loginSchema } from "@/schemas/loginSchema";
import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/schemas/loginSchema";

import { FaGithub } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoaderButton } from "@/components/ui/loaderbutton";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values: LoginSchema) {
    const { email } = values;

    startTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp(
        {
          email,
          type: "sign-in",
        },
        {
          onSuccess: () => {
            toast.success("OTP Sent successfully!! Redirecting...");
            router.push(`/otp?email=${email}`);
          },
          onError: () => {
            toast.error("Something went wrong. Try again later!!");
          },
        }
      );
    });
  }

  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/onboarding", // Better Auth handles the redirect automatically
    });
  };

  const signInWithGithub = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/onboarding", // Better Auth handles the redirect automatically
    });
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <h2 className="text-gray-900 mb-2 text-center">Welcome back</h2>
        <p className="text-gray-600 text-center mb-8">
          Start turning meetings into insights
        </p>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <Button variant="outline" size="lg" className="w-full" onClick={signInWithGoogle}>
            <FcGoogle />
            Continue with Google
          </Button>

          <Button variant="outline" size="lg" className="w-full" onClick={signInWithGithub}>
            <FaGithub />
            Continue with Github
          </Button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LoaderButton type="submit" isLoading={isPending} className="w-full" icon={<Send />}>
              Send OTP
            </LoaderButton>
          </form>
        </Form>
      </div>
    </>
  );
}
