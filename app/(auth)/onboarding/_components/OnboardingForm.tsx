"use client";

import React, { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Building2, Globe, Image as ImageIcon, X } from "lucide-react";
import { UploadButton } from "@/utils/uploadthing";

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
import { OnboardingSchema, onboardingSchema } from "@/schemas/onboardingSchema";
import { createOrganizationAction } from "@/actions/organization";

export default function OnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<OnboardingSchema>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: "", slug: "", logo: "" },
  });

  const logoUrl = form.watch("logo");

  // Automatically sync Name to Slug
  const name = form.watch("name");
  useEffect(() => {
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
    form.setValue("slug", generatedSlug, { shouldValidate: true });
  }, [name, form]);

  async function onSubmit(values: OnboardingSchema) {
    startTransition(async () => {
      const { success, message } = await createOrganizationAction(values);
      if (success) {
        toast.success(message);
        router.push("/dashboard");
      } else {
        toast.error(message);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* LOGO UPLOAD SECTION */}
        <FormField
          control={form.control}
          name="logo"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center justify-center space-y-4">
              <FormLabel>Organization Logo</FormLabel>
              <FormControl>
                <div className="flex flex-col items-center gap-4">
                  {logoUrl ? (
                    <div className="relative h-20 w-20">
                      <img
                        src={logoUrl}
                        alt="Logo Preview"
                        className="h-full w-full rounded-lg object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => form.setValue("logo", "")}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                      <UploadButton
                        endpoint="organizationLogo"
                        onClientUploadComplete={(res) => {
                          form.setValue("logo", res[0].url);
                          toast.success("Logo uploaded!");
                        }}
                        onUploadError={(error: Error) => {
                          toast.error(`Upload failed: ${error.message}`);
                        }}
                        appearance={{
                          button: "bg-indigo-600 text-xs px-2 h-8",
                          allowedContent: "hidden",
                        }}
                      />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="Acme Inc" className="pl-9" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Slug</FormLabel>
              <FormControl>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="acme-inc" className="pl-9" {...field} />
                </div>
              </FormControl>
              <FormDescription>
                This is your unique workspace URL.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <LoaderButton
          type="submit"
          isLoading={isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          Finish Setup
        </LoaderButton>
      </form>
    </Form>
  );
}