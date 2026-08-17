import { ProtectedPage } from "@/components/auth/protected-page";

export default function AccountPage() {
  return <ProtectedPage allowedRole="CUSTOMER" eyebrow="Customer profile" title="Your appointments" description="Your profile is ready. Appointment discovery and reservation management arrive in the next features." />;
}
