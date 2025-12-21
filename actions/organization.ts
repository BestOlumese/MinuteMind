"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { protectPage } from "@/lib/auth-utils";

export async function createOrganizationAction(values: {
  name: string;
  slug: string;
  logo: string;
}) {
  // 1. Get the session on the server
  const session = await protectPage(true);

  try {
    // 2. Check slug availability using the SERVER API
    // Note: auth.api calls don't need 'await headers()' again if 
    // you are passing the userId or using the internal server context
    const isSlugTaken = await auth.api.checkOrganizationSlug({
        body: { slug: values.slug }
    });

    if (!isSlugTaken.status) {
       return { success: false, message: "This URL slug is already taken." };
    }

    // 3. Create Organization using the SERVER API
    // We use auth.api.createOrganization which talks directly to Prisma
    const organization = await auth.api.createOrganization({
      headers: await headers(), // This is needed to link the current user
      body: {
        name: values.name,
        slug: values.slug,
        logo: values.logo,
        // Better Auth uses the session headers to identify the creator
      },
    });

    if (!organization) {
      return { success: false, message: "Failed to create organization." };
    }

    // 4. Update the UI cache
    revalidatePath("/dashboard");
    
    return { 
      success: true, 
      message: "Organization created successfully.",
      data: organization 
    };

  } catch (error: any) {
    console.error("ORG_CREATE_ERROR:", error);
    return { 
      success: false, 
      message: error?.message || "Internal Server Error" 
    };
  }
}