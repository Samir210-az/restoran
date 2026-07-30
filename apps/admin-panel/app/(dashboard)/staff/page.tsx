import { Users, Mail, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, Input, Badge } from "@restoran/ui";
import { ROLE_LABELS, STAFF_ROLES } from "@restoran/types";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { StaffRow } from "@/components/staff/StaffRow";
import { inviteStaffAction, cancelInvitationAction } from "./actions";

export const metadata = { title: "İşçilər" };

export default async function StaffPage() {
  const { restaurantId, userId, role } = await getCurrentStaffContext();
  const isOwner = role === "owner";
  const supabase = getSupabaseServerClient();

  const [{ data: staffList }, { data: invitations }] = await Promise.all([
    (
      supabase as unknown as {
        rpc: (
          fn: string,
          args: unknown
        ) => Promise<{
          data:
            | {
                id: string;
                user_id: string;
                full_name: string | null;
                email: string;
                role: (typeof STAFF_ROLES)[number];
                is_active: boolean;
              }[]
            | null;
        }>;
      }
    ).rpc("get_staff_list", { _restaurant_id: restaurantId }),
    supabase.from("staff_invitations").select("id, email, role, created_at").eq("restaurant_id", restaurantId),
  ]);

  const staff = staffList ?? [];
  const pendingInvites = invitations ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">İşçilər</h1>
        <p className="text-sm text-text-secondary">Komandanızı idarə edin — dəvət göndərin, rol təyin edin</p>
      </div>

      <Card>
        {staff.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Users className="h-8 w-8 text-text-muted" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Hələ işçi yoxdur</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {staff.map((s) => (
              <StaffRow
                key={s.id}
                staffId={s.id}
                fullName={s.full_name}
                email={s.email}
                role={s.role}
                isActive={s.is_active}
                isSelf={s.user_id === userId}
                canManage={isOwner}
              />
            ))}
          </div>
        )}
      </Card>

      {isOwner && pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Gözləyən dəvətlər</CardTitle>
              <CardDescription>Bu e-poçtlar hələ qeydiyyatdan keçməyib — keçəndə avtomatik qoşulacaqlar</CardDescription>
            </div>
          </CardHeader>
          <div className="flex flex-col divide-y divide-border">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  <span className="text-text-primary">{inv.email}</span>
                  <Badge variant="warning">{ROLE_LABELS[inv.role].az}</Badge>
                </div>
                <form action={cancelInvitationAction.bind(null, inv.id)}>
                  <button
                    type="submit"
                    aria-label="Dəvəti ləğv et"
                    className="rounded-md p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isOwner && (
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Yeni işçi dəvət et</CardTitle>
          </CardHeader>
          <form action={inviteStaffAction} className="flex flex-col gap-3">
            <Input name="email" type="email" placeholder="isci@restoran.az" required />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Rol</span>
              <select
                name="role"
                required
                className="h-10 rounded-md border border-border-strong bg-bg px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {STAFF_ROLES.filter((r) => r !== "owner").map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r].az}
                  </option>
                ))}
              </select>
            </label>
            <SubmitButton className="self-start">Dəvət et</SubmitButton>
          </form>
          <p className="mt-3 text-xs text-text-muted">
            Qeyd: hələlik avtomatik e-poçt göndərilmir — dəvət olunan şəxsə linki (
            {process.env.NEXT_PUBLIC_APP_URL ?? "restoran-admin-panel.vercel.app"}/register) özünüz göndərməlisiniz.
          </p>
        </Card>
      )}
    </div>
  );
}
