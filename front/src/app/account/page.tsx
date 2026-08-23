import { ProtectedPage } from "@/components/auth/protected-page";
import Link from "next/link";

export default function AccountPage() {
  return (
    <>
      <ProtectedPage
        allowedRole="CUSTOMER"
        eyebrow="پروفایل مشتری"
        title="نوبت‌های شما"
        description="سالن، خدمت و زمان آزاد موردنظر خود را برای رزرو انتخاب کنید."
      />
      <Link
        href="/salons"
        className="fixed bottom-6 right-6 rounded-full bg-amber-800 px-6 py-3 font-semibold text-white shadow-lg"
      >
        مشاهده سالن‌ها
      </Link>
    </>
  );
}
