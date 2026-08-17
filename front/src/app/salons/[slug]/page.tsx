import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { getApiUrl } from "@/lib/api-url";
import type { Salon, SalonService } from "@/types/salon";

export const dynamic = "force-dynamic";

export default async function SalonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const salonResponse = await fetch(getApiUrl(`salons/${encodeURIComponent(slug)}`), { cache: "no-store" });
  if (salonResponse.status === 404) notFound();
  if (!salonResponse.ok) throw new Error("Could not load salon details.");
  const { data: { salon } } = await salonResponse.json() as { data: { salon: Salon } };
  const servicesResponse = await fetch(getApiUrl(`salons/${salon.id}/services`), { cache: "no-store" });
  const servicePayload = servicesResponse.ok ? await servicesResponse.json() as { data: SalonService[] } : { data: [] };
  return (
    <><SiteHeader /><main className="mx-auto min-h-screen max-w-5xl px-6 py-14">
      <Link href="/salons" className="text-sm font-semibold text-amber-900 hover:underline">← All salons</Link>
      <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm md:p-12">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{salon.audience}</span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-stone-900">{salon.name}</h1>
        <p className="mt-4 max-w-3xl leading-7 text-stone-600">{salon.description || "Professional salon services."}</p>
        <address className="mt-7 not-italic text-sm leading-6 text-stone-600">{salon.streetAddress}<br />{salon.city}{salon.region ? `, ${salon.region}` : ""} · {salon.countryCode}</address>
      </section>
      <section className="mt-10"><h2 className="text-2xl font-bold text-stone-900">Services</h2>
        {servicePayload.data.length === 0 ? <p className="mt-5 rounded-2xl bg-white p-6 text-stone-600">No active services are listed yet.</p> : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">{servicePayload.data.map((service) => (
            <li key={service.id} className="rounded-2xl border border-stone-200 bg-white p-6"><div className="flex justify-between gap-4"><h3 className="font-bold text-stone-900">{service.name}</h3><span className="font-semibold text-amber-900">{formatMoney(service.priceMinor, service.currency)}</span></div><p className="mt-2 text-sm text-stone-600">{service.durationMinutes} minutes</p><p className="mt-3 text-sm leading-6 text-stone-600">{service.description}</p></li>
          ))}</ul>
        )}
      </section>
    </main></>
  );
}

function formatMoney(priceMinor: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(priceMinor / 100);
}
