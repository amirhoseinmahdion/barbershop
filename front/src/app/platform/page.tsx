import { ProtectedPage } from "@/components/auth/protected-page";

export default function PlatformPage() {
  return <ProtectedPage allowedRole="SUPER_ADMIN" eyebrow="مدیریت سامانه" title="شبکه سالن‌ها" description="سالن‌ها را ایجاد کنید و مدیر هر سالن را با شماره تلفن تعیین کنید." managePlatform />;
}
