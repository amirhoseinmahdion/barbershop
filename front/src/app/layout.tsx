import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/vazirmatn";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "رزرو سالن زیبایی",
  description: "سالن‌های زیبایی را پیدا کنید و نوبت خود را آنلاین رزرو کنید.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        {children}
        <Toaster
          dir="rtl"
          position="top-center"
          richColors
          closeButton
          toastOptions={{ closeButtonAriaLabel: "بستن اعلان" }}
        />
      </body>
    </html>
  );
}
