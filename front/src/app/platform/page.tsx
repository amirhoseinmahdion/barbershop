import { ProtectedPage } from "@/components/auth/protected-page";

export default function PlatformPage() {
  return <ProtectedPage allowedRole="SUPER_ADMIN" eyebrow="Platform administration" title="Platform overview" description="This protected area is reserved for platform administrators." />;
}
