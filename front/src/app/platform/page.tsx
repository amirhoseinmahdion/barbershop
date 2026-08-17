import { ProtectedPage } from "@/components/auth/protected-page";

export default function PlatformPage() {
  return <ProtectedPage allowedRole="SUPER_ADMIN" eyebrow="Platform administration" title="Salon network" description="Create salons and assign each salon administrator by phone number." managePlatform />;
}
