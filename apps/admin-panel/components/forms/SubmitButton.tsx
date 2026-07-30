"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@restoran/ui";

/**
 * useFormStatus() yalnix bagli oldugu <form>-un Server Action-i davam
 * edirse `pending: true` qaytarir. Bu, dyme-ni avtomatik sondurur ve
 * "..." gosterir - istifadeci "iwlemedi?" deye 2-3 defe basmasin deye.
 */
export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending} disabled={pending} {...props}>
      {children}
    </Button>
  );
}
