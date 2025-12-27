"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Lock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadButton } from "@/utils/uploadthing";
import { updateOrganization } from "@/actions/settings";

interface OrgFormProps { 
  organization: any; 
  readOnly?: boolean;
}

export function OrgForm({ organization, readOnly = false }: OrgFormProps) {
  const router = useRouter();
  const [name, setName] = useState(organization.name || "");
  // Note: Adjust 'logo' to 'image' if your prisma schema uses 'image' for organization
  const [logo, setLogo] = useState(organization.logo || ""); 
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    setIsLoading(true);
    try {
      await updateOrganization({ name, image: logo });
      toast.success("Organization settings updated");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update organization");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={readOnly ? "opacity-80 bg-gray-50 border-gray-200" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            Organization Settings
            {readOnly && <Lock className="w-4 h-4 text-gray-400" />}
        </CardTitle>
        <CardDescription>Manage your workspace branding and details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* LOGO UPLOAD SECTION */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-white shrink-0">
              {logo ? (
                 <img src={logo} alt="Org Logo" className="w-full h-full object-cover" />
              ) : (
                 <Building2 className="w-8 h-8 text-gray-300" />
              )}
            </div>
            
            {!readOnly && (
                <div className="flex flex-col gap-2">
                <Label>Workspace Logo</Label>
                <UploadButton
                    endpoint="orgLogo"
                    onClientUploadComplete={(res) => {
                      if (res && res[0]) {
                        setLogo(res[0].url);
                        toast.success("Logo uploaded. Click 'Save Workspace' to apply.");
                      }
                    }}
                    onUploadError={(error: Error) => toast.error(`Error: ${error.message}`)}
                    appearance={{
                      button: "bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 text-sm h-9 px-4 w-auto focus-visible:ring-0",
                      allowedContent: "hidden"
                    }}
                    content={{ button: "Upload Logo" }}
                />
                </div>
            )}
          </div>

          {/* NAME INPUT */}
          <div className="space-y-2 max-w-md">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input 
              id="orgName" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              disabled={readOnly}
              placeholder="e.g. Acme Corp"
            />
          </div>

          {!readOnly && (
              <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isLoading ? "Saving..." : "Save Workspace"}
              </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}