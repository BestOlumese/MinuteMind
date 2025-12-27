"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadButton } from "@/utils/uploadthing";
import { updateUserProfile } from "@/actions/settings";

export function ProfileForm({ user }: { user: any }) {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [image, setImage] = useState(user.image || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateUserProfile({ name, image });
      toast.success("Profile updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your public profile details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* IMAGE UPLOAD SECTION */}
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20 border-2 border-gray-100">
              <AvatarImage src={image} className="object-cover" />
              <AvatarFallback className="text-xl bg-indigo-50 text-indigo-600">
                {name?.substring(0, 2).toUpperCase() || <User />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <Label>Profile Picture</Label>
              <UploadButton
                endpoint="userImage"
                onClientUploadComplete={(res) => {
                  if (res && res[0]) {
                    setImage(res[0].url);
                    toast.success("Image uploaded. Click 'Save Changes' to apply.");
                  }
                }}
                onUploadError={(error: Error) => toast.error(`Error: ${error.message}`)}
                appearance={{
                  button: "bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 text-sm h-9 px-4 w-auto focus-visible:ring-0",
                  allowedContent: "hidden"
                }}
                content={{ button: "Change Avatar" }}
              />
            </div>
          </div>

          {/* NAME INPUT */}
          <div className="space-y-2 max-w-md">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. John Doe"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}