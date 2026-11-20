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
  const { restaurantId, role, userId } = await getCurrentStaffContext();
  if (role !== "owner" && role !== "manager" && role !== "waiter") {
    throw new Error("FORBIDDEN: yalnız ofisiant/menecer/sahib sifarişi təhvil verə bilər");
  }

  const supabase = getSupabaseServerClient();
  await supabase
    .from("orders")
    .update({ status: "served", served_at: new Date().toISOString(), served_by: userId })
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .eq("status", "ready");

  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

/**
 * Legv: sebeb mutleqdir. Sahib/menecer odenilmemis istenilen sifarisi,
 * kassir/ofisiant ise yalniz hele metbexe baslamamis ("pending")
 * sifarisi legv ede biler. Odenisi alinmish sifarish legv olunmur.
 */
export async function cancelOrderAction(orderId: string, reason: string) {
  const { restaurantId, role, userId } = await getCurrentStaffContext();
  if (role === "chef" || role === "courier") {
    throw new Error("FORBIDDEN: bu rol sifarişi ləğv edə bilməz");
  }
  const cleanReason = reason.trim();
  if (cleanReason.length < 3) {
    throw new Error("REASON_REQUIRED: ləğv səbəbi yazılmalıdır");
  }

  const supabase = getSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (!order || order.status === "cancelled" || order.status === "completed") return;

  const isManagement = role === "owner" || role === "manager";
  if (!isManagement && order.status !== "pending") {
    throw new Error("FORBIDDEN: mətbəxə keçmiş sifarişi yalnız menecer və ya sahib ləğv edə bilər");
  }

  const { data: paid } = await supabase
    .from("payments")
    .select("id")
    .eq("order_id", orderId)
    .eq("restaurant_id", restaurantId)
    .eq("status", "completed")
    .limit(1);
  if (paid && paid.length > 0) {
    throw new Error("PAID: ödənişi alınmış sifariş ləğv edilə bilməz");
  }

  await supabase
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      cancel_reason: cleanReason,
    })
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId);
  revalidatePath("/orders");
  revalidatePath("/kitchen");
  revalidatePath("/bar");
}

/**
 * Odenis alinmasi = sifarişin BAGLANMASI. Kassir pulu alan kimi (nagd
 * ve ya kartdan-karta teserrufunu tesdiqleyende) bu TEK duyme HEM
 * payments.status-u "completed" edir, HEM DE orders.status-u birbasa
 * "completed" edir - real restoranda bu iki hadise HEMISE eyni andir
 * (kassir pulu goturur VE ticket-i baglayir), ayri-ayri addim deyil.
 * Legv edilmis sifarisi toxunmuruq (neq status cancelled).
 */
export async function markPaymentReceivedAction(orderId: string, method: "cash" | "card") {
  const { restaurantId, role, userId, staffId } = await getCurrentStaffContext();
  const isCashDesk = role === "owner" || role === "manager" || role === "cashier";
  if (!isCashDesk && role !== "courier") {
    throw new Error("FORBIDDEN: yalnız kassir/menecer/sahib ödəniş qəbul edə bilər");
  }
  if (method !== "cash" && method !== "card") return;
  const supabase = getSupabaseServerClient();

  const { data: current } = await supabase
    .from("orders")
    .select("status, order_type, courier_id, served_at")
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (!current || (current.status !== "ready" && current.status !== "served")) {
    throw new Error("NOT_READY: sifariş hələ hazır deyil, ödəniş qəbul edilmir");
  }
  if (!isCashDesk) {
    if (current.order_type !== "delivery" || current.courier_id !== staffId || current.status !== "served") {
      throw new Error("FORBIDDEN: kuryer yalnız öz çatdırdığı sifarişin pulunu ala bilər");
    }
  }

  await supabase
    .from("payments")
    .update({ status: "completed", method })
    .eq("order_id", orderId)
    .eq("restaurant_id", restaurantId);

  await supabase
    .from("orders")
    .update({
      status: "completed",
      paid_at: new Date().toISOString(),
      paid_by: userId,
      ...(current.order_type === "takeaway" && !current.served_at
        ? { served_at: new Date().toISOString(), served_by: userId }
        : {}),
    })
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
 * Masanin butun ACIQ (odenmemis) sifarişlerini BIR DEFEYE baglayir -
 * masa hesabi konsepti ucun (bax: /tables/[id]) - bir masaya bir
 * neçe defe elave sifariş verilmiş ola biler (bax: musteri "elave
 * sifariş ver" duymesi), kassir/sahib hamısını tek kliklə bağlaya bilir.
 */
export async function payAllTableOrdersAction(tableId: string, method: "cash" | "card") {
  const { restaurantId, role, userId } = await getCurrentStaffContext();
  if (role !== "owner" && role !== "manager" && role !== "cashier") {
    throw new Error("FORBIDDEN: yalnız kassir/menecer/sahib ödəniş qəbul edə bilər");
  }

  if (method !== "cash" && method !== "card") return;

  const supabase = getSupabaseServerClient();
  const { data: openOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("table_id", tableId)
    .in("status", ["ready", "served"]);

  for (const o of openOrders ?? []) {
    await supabase.from("payments").update({ status: "completed", method }).eq("order_id", o.id).eq("restaurant_id", restaurantId);
    await supabase
      .from("orders")
      .update({ status: "completed", paid_at: new Date().toISOString(), paid_by: userId })
      .eq("id", o.id)
      .eq("restaurant_id", restaurantId)
      .neq("status", "cancelled");
  }

  revalidatePath(`/tables/${tableId}`);
  revalidatePath("/tables");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
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

/**
 * Kuryerin oz telefonundan etdiyi addimlar: sifarisi uzerine gotur ("claim"),
 * yemeyi gotur ("picked_up" = yoldadir), catdir ("delivered").
 * Sahib/menecer de eyni addimlari ede biler. Kuryer yalniz oz (ve ya
 * hele kimsəyə verilməmiş) sifarişi ile islaye biler.
 */
export async function courierDeliveryStepAction(orderId: string, step: "claim" | "picked_up" | "delivered") {
  const { restaurantId, role, userId, staffId } = await getCurrentStaffContext();
  if (role !== "courier" && role !== "owner" && role !== "manager") {
    throw new Error("FORBIDDEN: bu əməliyyat yalnız kuryer üçündür");
  }

  const supabase = getSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("status, order_type, courier_id, picked_up_at")
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (!order || order.order_type !== "delivery") return;

  const isManagement = role !== "courier";
  if (!isManagement && order.courier_id && order.courier_id !== staffId) {
    throw new Error("FORBIDDEN: bu sifariş başqa kuryerə verilib");
  }

  const now = new Date().toISOString();

  if (step === "claim") {
    if (order.courier_id) return;
    await supabase
      .from("orders")
      .update({ courier_id: staffId, courier_name: null, courier_phone: null })
      .eq("id", orderId)
      .eq("restaurant_id", restaurantId)
      .is("courier_id", null);
  }

  if (step === "picked_up") {
    if (order.status !== "ready" || order.picked_up_at) return;
    await supabase
      .from("orders")
      .update({ picked_up_at: now, ...(order.courier_id ? {} : { courier_id: staffId }) })
      .eq("id", orderId)
      .eq("restaurant_id", restaurantId);
  }

  if (step === "delivered") {
    if (order.status !== "ready" || !order.picked_up_at) return;
    await supabase
      .from("orders")
      .update({ status: "served", delivered_at: now, served_at: now, served_by: userId })
      .eq("id", orderId)
      .eq("restaurant_id", restaurantId);
  }

  revalidatePath("/orders");
}
