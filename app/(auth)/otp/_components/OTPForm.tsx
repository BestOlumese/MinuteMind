"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Check } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { LoaderButton } from "@/components/ui/loaderbutton";
import { OtpSchema, otpSchema } from "@/schemas/otpSchema";

export default function OTPForm({ email }: { email: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<OtpSchema>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  async function onSubmit(values: OtpSchema) {
    startTransition(async () => {
      const { data, error } = await authClient.signIn.emailOtp({
        email: email,
        otp: values.otp,
      });

      if (error) {
        toast.error(error.message || "Invalid OTP code");
        return;
      }

      toast.success("Verified successfully!");
      // This will trigger your proxy.ts logic to check for Organization status
      router.push("/onboarding");
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
      <h2 className="text-gray-900 mb-2 text-center text-2xl font-semibold">
        Verify your email
      </h2>
      <p className="text-gray-600 text-center mb-8">
        We sent a code to{" "}
        <span className="font-medium text-gray-900">{email}</span>
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 flex flex-col items-center"
        >
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center">
                <FormLabel className="sr-only">One-Time Password</FormLabel>
                <FormControl>
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormLabel className="sr-only">
                          One-Time Password
                        </FormLabel>
                        <FormControl>
                          <InputOTP
                            maxLength={6}
                            {...field}
                          >
                            <InputOTPGroup className="gap-2">
                              <InputOTPSlot
                                index={0}
                                className="rounded-lg border-gray-300 focus:ring-indigo-600"
                              />
                              <InputOTPSlot
                                index={1}
                                className="rounded-lg border-gray-300 focus:ring-indigo-600"
                              />
                              <InputOTPSlot
                                index={2}
                                className="rounded-lg border-gray-300 focus:ring-indigo-600"
                              />
                              <InputOTPSlot
                                index={3}
                                className="rounded-lg border-gray-300 focus:ring-indigo-600"
                              />
                              <InputOTPSlot
                                index={4}
                                className="rounded-lg border-gray-300 focus:ring-indigo-600"
                              />
                              <InputOTPSlot
                                index={5}
                                className="rounded-lg border-gray-300 focus:ring-indigo-600"
                              />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormDescription>
                          Please enter the 6-digit code sent to your email.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <LoaderButton
            type="submit"
            isLoading={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            icon={<Check className="h-4 w-4" />}
          >
            Verify Code
          </LoaderButton>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <button
          onClick={() => toast.info("Check your inbox for a new code.")}
          className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
        >
          Didn't receive a code? Resend
        </button>
      </div>
    </div>
  );
}
