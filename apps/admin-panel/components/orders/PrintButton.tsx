"use client";

import { Printer } from "lucide-react";
import { Button } from "@restoran/ui";

export function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
      Çap et
    </Button>
  );
}
