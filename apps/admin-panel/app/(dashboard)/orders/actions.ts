"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";

/**
 * Mətbəx-sifariş avtomatik sinxronizasiyası (bax: kitchen/actions.ts)
 * artıq pending->preparing->ready keçidlərini ÖZÜ idarə edir - burada
 * ümumi "Növbəti mərhələ" düyməsinə artıq EHTİYAC YOXDUR (əksinə, hər
 * kəsə açıq olması aşpazın avtomatik axını ilə toqquşub qarışıqlıq
 * yaradırdı). Qalan YEGANƏ iki əl ilə addım aydın rol bağlıdır:
 * ofisiant "Stola verildi" deyir, kassir/sahib "Ödəniş alındı" deyir.
 */
export async function markOrderServedAction(orderId: string) {
  const { restaurantId, role } = await getCurrentStaffContext();
  if (role !== "owner" && role !== "manager" && role !== "waiter") {
    throw new Error("FORBIDDEN: yalnız ofisiant/menecer/sahib sifarişi təhvil verə bilər");
  }

  const supabase = getSupabaseServerClient();
  await supabase
    .from("orders")
    .update({ status: "served" })
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .eq("status", "ready");

  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

export async function cancelOrderAction(orderId: string) {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();
  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("restaurant_id", restaurantId);
  revalidatePath("/orders");
}

/**
 * Odenis alinmasi = sifarişin BAGLANMASI. Kassir pulu alan kimi (nagd
 * ve ya kartdan-karta teserrufunu tesdiqleyende) bu TEK duyme HEM
 * payments.status-u "completed" edir, HEM DE orders.status-u birbasa
 * "completed" edir - real restoranda bu iki hadise HEMISE eyni andir
 * (kassir pulu goturur VE ticket-i baglayir), ayri-ayri addim deyil.
 * Legv edilmis sifarisi toxunmuruq (neq status cancelled).
 */
export async function markPaymentReceivedAction(orderId: string) {
  const { restaurantId, role } = await getCurrentStaffContext();
  if (role !== "owner" && role !== "manager" && role !== "cashier") {
    throw new Error("FORBIDDEN: yalnız kassir/menecer/sahib ödəniş qəbul edə bilər");
  }
  const supabase = getSupabaseServerClient();

  await supabase
    .from("payments")
    .update({ status: "completed" })
    .eq("order_id", orderId)
    .eq("restaurant_id", restaurantId);

  await supabase
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .neq("status", "cancelled");

  revalidatePath("/orders");
  revalidatePath("/kitchen");
  revalidatePath("/dashboard");
  revalidatePath("/tables");
}

/**
 * Ehtiyat duymesi: odenis artiq "completed" olan, amma (kohne bug
 * ucun ve ya elle qeyd sebebinden) status hele "served"de qalmis
 * sifarisleri baglamaq ucun. Adeten markPaymentReceivedAction bunu
 * avtomatik edir - bu, YALNIZ "ilişmiş" sifarisler ucun ehtiyatdir.
 */
export async function closeOrderAction(orderId: string) {
  const { restaurantId, role } = await getCurrentStaffContext();
  if (role !== "owner" && role !== "manager" && role !== "cashier") {
    throw new Error("FORBIDDEN: yalnız kassir/menecer/sahib sifarişi bağlaya bilər");
  }
  const supabase = getSupabaseServerClient();
  await supabase
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .neq("status", "cancelled");
  revalidatePath("/orders");
  revalidatePath("/tables");
}

/**
 * Sifarişə manual endirim tətbiq edir - YALNIZ owner/manager (kassir/
 * ofisiant/aşpaz bunu edə bilməz). Faiz ötürülübsə, o an ki `total`-a
 * gorə real məbləğə cevrilib saxlanılır (bax: orders.discount_amount) -
 * `total`-un ozune TOXUNULMUR (o, yemeklerin cemi olaraq qalir), qebz
 * ve hesabatlarda "real gelir" = total - discount_amount kimi gosterilir.
 */
export async function applyOrderDiscountAction(
  orderId: string,
  discount: { mode: "amount" | "percent"; value: number }
) {
  const { restaurantId, role } = await getCurrentStaffContext();
  if (role !== "owner" && role !== "manager") {
    throw new Error("FORBIDDEN: yalnız sahib və ya menecer endirim tətbiq edə bilər");
  }
  if (!Number.isFinite(discount.value) || discount.value < 0) return;

  const supabase = getSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("total")
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (!order) return;

  const orderTotal = Number(order.total);
  const discountAmount =
    discount.mode === "percent"
      ? Math.min(orderTotal, (orderTotal * Math.min(discount.value, 100)) / 100)
      : Math.min(orderTotal, discount.value);

  await supabase
    .from("orders")
    .update({ discount_amount: discountAmount })
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId);

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

/**
 * Catdirilma sifarisine kuryer tayin edir - ya restoranin OZ kuryer-rollu
 * isçisini (courier_id, staff_members-e istinad), ya da sistemde hesabi
 * olmayan ad-hoc kuryerin ad+telefonunu (courier_name/courier_phone).
 * Ikisi qarisiq gonderilse, staff kuryeri ustunluk teskil edir.
 */
export async function assignCourierAction(
  orderId: string,
  courier: { courierId?: string; courierName?: string; courierPhone?: string }
) {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();

  await supabase
    .from("orders")
    .update({
      courier_id: courier.courierId || null,
      courier_name: courier.courierId ? null : courier.courierName?.trim() || null,
      courier_phone: courier.courierId ? null : courier.courierPhone?.trim() || null,
    })
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId);

  revalidatePath("/orders");
}
