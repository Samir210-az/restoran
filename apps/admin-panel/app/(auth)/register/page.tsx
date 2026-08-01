import { redirect } from "next/navigation";

export const metadata = { title: "Qeydiyyat" };

/**
 * QEYD (bug duzelisi): bu sehife defelerle YANLIŞLIQLA bos/tekrarlanan
 * restoranlarin yaranmasina sebeb olub - Samir (platform admin) bura
 * tesadufen dushub ad yazanda hemin an YENI restoran yaranirdi. Hazirda
 * BUTUN restoranlar Samir terefinden /platform-dan yaradilir (musteri
 * ozu-qeydiyyat axini aktiv istifade olunmur), ona gore bu sehife
 * muveqqeti bagli - /login-e yonlendirilir. Lazim olsa (real musteri
 * oz-qeydiyyat axini isteyende) asanliqla geri acila biler.
 */
export default function RegisterPage() {
  redirect("/login");
}
