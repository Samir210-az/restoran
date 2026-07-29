import { MailCheck } from "lucide-react";

export const metadata = { title: "E-poçtunuzu yoxlayın" };

export default function CheckEmailPage() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <MailCheck className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-text-primary">E-poçtunuzu təsdiqləyin</h1>
      <p className="text-sm text-text-secondary">
        Hesabınızı aktivləşdirmək üçün e-poçtunuza göndərdiyimiz linkə klikləyin. Təsdiqdən sonra daxil
        ola və restoran qurulumunu tamamlaya bilərsiniz.
      </p>
    </div>
  );
}
