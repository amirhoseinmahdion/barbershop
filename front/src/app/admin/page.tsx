import { ProtectedPage } from "@/components/auth/protected-page";

export default function AdminPage() {
  return <ProtectedPage allowedRole="SALON_ADMIN" eyebrow="Salon dashboard" title="Manage your salon" description="Update your account, salon profile, and customer-facing services." manageSalon />;
}
