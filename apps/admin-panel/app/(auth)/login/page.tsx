import { RoleLoginGate } from "@/components/auth/RoleLoginGate";

export const metadata = { title: "Daxil ol" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return <RoleLoginGate error={searchParams.error} />;
}
