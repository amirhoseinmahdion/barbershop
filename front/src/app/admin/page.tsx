import { ProtectedPage } from "@/components/auth/protected-page";

export default function AdminPage() {
  return (
    <ProtectedPage
      allowedRole="SALON_ADMIN"
      eyebrow="پنل مدیریت سالن"
      title="مدیریت سالن شما"
      description="پروفایل شخصی، اطلاعات سالن، خدمات و رزروهای مشتریان را مدیریت کنید."
      manageSalon
    />
  );
}
