import { ProtectedPage } from "@/components/auth/protected-page";

export default function AdminPage() {
  return <ProtectedPage allowedRole="SALON_ADMIN" eyebrow="Salon dashboard" title="Manage your salon" description="Only assigned salon administrators can access scheduling and reservation settings here." />;
}
