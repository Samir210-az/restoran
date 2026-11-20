import { getSupabaseServerClient } from "@/lib/supabase-server";
import { stickerUrl } from "@/lib/sticker-library";

const BUCKET = "menu-item-images";
const MAX_BYTES = 2 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export type ImageUploadResult = { url: string } | { error: string } | null;

/** Formda şəkil seçilməyibsə null qaytarır. */
export async function uploadMenuItemImage(restaurantId: string, file: FormDataEntryValue | null): Promise<ImageUploadResult> {
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = EXTENSIONS[file.type];
  if (!ext) return { error: "Şəkil yalnız PNG, JPEG və ya WEBP ola bilər" };
  if (file.size > MAX_BYTES) return { error: "Şəkil 2MB-dan böyük ola bilməz" };

  const supabase = getSupabaseServerClient();
  const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) return { error: "Şəkil yüklənə bilmədi: " + error.message };

  return { url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

/** Köhnə şəkli saxlama yerindən silir; alınmasa da əsas əməliyyat pozulmur. */
export async function removeMenuItemImage(restaurantId: string, imageUrl: string | null | undefined) {
  if (!imageUrl) return;
  const marker = `/${BUCKET}/`;
  const index = imageUrl.indexOf(marker);
  if (index === -1) return;
  const path = imageUrl.slice(index + marker.length);
  if (!path.startsWith(`${restaurantId}/`)) return;
  await getSupabaseServerClient().storage.from(BUCKET).remove([path]);
}

/** Formdan seçilmiş hazır stikerin ünvanı; seçilməyibsə və ya siyahıda yoxdursa null. */
export function pickedStickerUrl(value: FormDataEntryValue | null) {
  return typeof value === "string" && value ? stickerUrl(value) : null;
}
