"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Building2, Globe, Plus, X } from "lucide-react";
import { OnboardingSchema, onboardingSchema } from "@/schemas/onboardingSchema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoaderButton } from "@/components/ui/loaderbutton";
import { UploadButton } from "@/utils/uploadthing";
import { useRouter } from "next/navigation";

export function CreateOrganizationModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<OnboardingSchema>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: "", slug: "", logo: "" },
  });

  const logoUrl = form.watch("logo");

  // Sync Name to Slug
  const name = form.watch("name");
  React.useEffect(() => {
    const generatedSlug = name?.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
    form.setValue("slug", generatedSlug, { shouldValidate: true });
  }, [name, form]);

  async function onSubmit(values: OnboardingSchema) {
    startTransition(async () => {
      const { data, error } = await authClient.organization.create({
        name: values.name,
        slug: values.slug,
        logo: values.logo,
      });

      if (error) {
        toast.error(error.message || "Failed to create organization");
        return;
      }

      toast.success("New workspace created and activated!");
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Add a new organization to MinuteMind. You will be the owner.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center justify-center space-y-2">
                  <FormControl>
                    <div className="flex flex-col items-center gap-2">
                      {logoUrl ? (
                        <div className="relative h-16 w-16">
                          <img src={logoUrl} alt="Logo" className="h-full w-full rounded-lg object-cover border" />
                          <button
                            type="button"
                            onClick={() => form.setValue("logo", "")}
                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <UploadButton
                          endpoint="organizationLogo"
                          onClientUploadComplete={(res) => form.setValue("logo", res[0].url)}
                          appearance={{ button: "bg-indigo-600 text-[10px] px-2 h-7", allowedContent: "hidden" }}
                        />
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
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc" {...field} />
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
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="acme-inc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LoaderButton isLoading={isPending} className="w-full">
              Create & Switch
            </LoaderButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}