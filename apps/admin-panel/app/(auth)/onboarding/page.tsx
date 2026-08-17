import { Input } from "@restoran/ui";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { completeOnboardingAction } from "./actions";

export const metadata = { title: "Restoranınızı quraşdırın" };

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Son bir addım qalıb</h1>
        <p className="mt-1 text-sm text-text-secondary">Restoranınızın adını daxil edin, panelə keçək</p>
      </div>

      {searchParams.error && (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {searchParams.error}
        </div>
      )}

      <form action={completeOnboardingAction} className="flex flex-col gap-4">
        <Input
          label="Restoran adı"
          name="restaurantName"
          placeholder="Məs. Ləzzət Sarayı"
          autoFocus
          required
        />
        <SubmitButton className="w-full" size="lg">
          Davam et
        </SubmitButton>
      </form>
    </div>
  );
}
