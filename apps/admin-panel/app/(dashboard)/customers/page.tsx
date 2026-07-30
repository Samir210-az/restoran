import { Heart, Star } from "lucide-react";
import { Card, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, Badge } from "@restoran/ui";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const metadata = { title: "Müştərilər" };

export default async function CustomersPage() {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();

  const [{ data: customers }, { data: reviews }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone, loyalty_points, total_spent, visit_count")
      .eq("restaurant_id", restaurantId)
      .order("total_spent", { ascending: false })
      .limit(100),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const rows = customers ?? [];
  const reviewRows = reviews ?? [];
  const avgRating = reviewRows.length
    ? (reviewRows.reduce((sum, r) => sum + r.rating, 0) / reviewRows.length).toFixed(1)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Müştərilər</h1>
        <p className="text-sm text-text-secondary">Loyallıq balları və rəylər</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-text-secondary">Qeydə alınan müştəri</p>
          <p className="mt-1 text-3xl font-semibold text-text-primary">{rows.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Ümumi loyallıq balı</p>
          <p className="mt-1 text-3xl font-semibold text-text-primary">
            {rows.reduce((sum, c) => sum + c.loyalty_points, 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Orta reytinq</p>
          <p className="mt-1 flex items-center gap-1 text-3xl font-semibold text-text-primary">
            {avgRating ?? "—"}
            {avgRating && <Star className="h-5 w-5 fill-accent text-accent" aria-hidden="true" />}
          </p>
        </Card>
      </div>

      {rows.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Heart className="h-8 w-8 text-text-muted" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Hələ müştəri qeydə alınmayıb</p>
            <p className="text-xs text-text-muted">Müştəri sifariş verərkən telefon nömrəsi daxil etdikdə burada görünəcək</p>
          </div>
        </Card>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Ad</TableHeaderCell>
              <TableHeaderCell>Telefon</TableHeaderCell>
              <TableHeaderCell>Ziyarət</TableHeaderCell>
              <TableHeaderCell>Xərc</TableHeaderCell>
              <TableHeaderCell>Bal</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.full_name ?? "—"}</TableCell>
                <TableCell className="text-text-secondary">{c.phone}</TableCell>
                <TableCell>{c.visit_count}</TableCell>
                <TableCell>{Number(c.total_spent).toFixed(2)} ₼</TableCell>
                <TableCell>
                  <Badge variant="accent">{c.loyalty_points}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {reviewRows.length > 0 && (
        <>
          <h2 className="mt-2 text-lg font-semibold text-text-primary">Son rəylər</h2>
          <div className="flex flex-col gap-3">
            {reviewRows.map((r) => (
              <Card key={r.id}>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i <= r.rating ? "fill-accent text-accent" : "text-border-strong"}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                {r.comment && <p className="mt-2 text-sm text-text-secondary">{r.comment}</p>}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
