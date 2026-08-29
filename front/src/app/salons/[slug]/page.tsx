import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { getApiUrl } from "@/lib/api-url";
import type { Salon, SalonService } from "@/types/salon";
import { ReservationPicker } from "@/components/booking/reservation-picker";

export const dynamic = "force-dynamic";

export default async function SalonDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const salonResponse = await fetch(
    getApiUrl(`salons/${encodeURIComponent(slug)}`),
    { cache: "no-store" },
  );
  if (salonResponse.status === 404) notFound();
  if (!salonResponse.ok) throw new Error("اطلاعات سالن دریافت نشد.");
  const {
    data: { salon },
  } = (await salonResponse.json()) as { data: { salon: Salon } };
  const servicesResponse = await fetch(
    getApiUrl(`salons/${salon.id}/services`),
    { cache: "no-store" },
  );
  const servicePayload = servicesResponse.ok
    ? ((await servicesResponse.json()) as { data: SalonService[] })
    : { data: [] };
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-6 py-14">
        <Link
          href="/salons"
          className="text-sm font-semibold text-amber-900 hover:underline"
        >
          همه سالن‌ها ←
        </Link>
        <ReservationPicker salonId={salon.id} services={servicePayload.data} />
      </main>
    </>
  );
}
