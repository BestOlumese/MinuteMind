import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import OnboardingForm from "./_components/OnboardingForm";
import { protectPage } from "@/lib/auth-utils";

export default async function OnboardingPage() {
  const session = await protectPage(true);

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Setup your organization
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Create a workspace for your team and start managing meetings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OnboardingForm />
      </CardContent>
    </Card>
  );
}
