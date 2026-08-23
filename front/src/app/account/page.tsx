import { ProtectedPage } from "@/components/auth/protected-page";
import Link from "next/link";

export default function AccountPage() {
  return (
    <>
      <ProtectedPage
        allowedRole="CUSTOMER"
        eyebrow="Customer profile"
        title="Your appointments"
        description="Choose a salon, service, and available time for your reservation."
      />
      <Link
        href="/salons"
        className="fixed bottom-6 right-6 rounded-full bg-amber-800 px-6 py-3 font-semibold text-white shadow-lg"
      >
        Browse salons
      </Link>
    </>
  );
}
