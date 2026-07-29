/**
 * Bu fayl Faza 1-de EL ILE saxlanilir. Verilenler bazasi
 * migrasiyalari (supabase/migrations) yazilandan sonra
 * `supabase gen types typescript` komandasi ile avtomatik
 * generasiya olunacaq ve bu fayl evez olunacaq.
 *
 * Hazirda yalniz build-in qirilmamasi ucun minimal skelet saxlanilir.
 */
export interface Database {
  public: {
    Tables: Record<string, { Row: Record<string, unknown> }>;
  };
}
