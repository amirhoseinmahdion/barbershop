import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { getApiUrl } from "@/lib/api-url";
import type { Salon } from "@/types/salon";

export const dynamic = "force-dynamic";

export default async function SalonsPage({ searchParams }: { searchParams: Promise<{ audience?: string; search?: string }> }) {
  const filters = await searchParams;
  const query = new URLSearchParams();
  if (["MEN", "WOMEN", "UNISEX"].includes(filters.audience ?? "")) query.set("audience", filters.audience!);
  if (filters.search?.trim()) query.set("search", filters.search.trim());
  const response = await fetch(getApiUrl(`salons?${query.toString()}`), { cache: "no-store" });
  const payload = response.ok ? await response.json() as { data: Salon[] } : { data: [] };
  return (
    <><SiteHeader /><main className="mx-auto min-h-screen max-w-6xl px-6 py-14">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-800">Discover</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900">Find your salon</h1>
      <p className="mt-4 max-w-2xl text-stone-600">Browse active men&apos;s, women&apos;s, and unisex salons and compare their services.</p>
      <form className="mt-8 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-[1fr_180px_auto]" action="/salons">
        <label className="sr-only" htmlFor="salon-search">Search salons</label><input id="salon-search" name="search" defaultValue={filters.search} placeholder="Search by name or city" className="rounded-xl border border-stone-300 px-4 py-3" />
        <label className="sr-only" htmlFor="audience">Audience</label><select id="audience" name="audience" defaultValue={filters.audience ?? ""} className="rounded-xl border border-stone-300 px-4 py-3"><option value="">All salons</option><option value="MEN">Men</option><option value="WOMEN">Women</option><option value="UNISEX">Unisex</option></select>
        <button className="rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white">Search</button>
      </form>
      {payload.data.length === 0 ? <p className="mt-10 rounded-2xl bg-white p-6 text-stone-600">No salons are available right now.</p> : (
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{payload.data.map((salon) => (
          <li key={salon.id}><Link href={`/salons/${salon.slug}`} className="block h-full rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{salon.audience}</span>
            <h2 className="mt-5 text-xl font-bold text-stone-900">{salon.name}</h2>
            <p className="mt-2 text-sm text-stone-600">{salon.city}, {salon.countryCode}</p>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-600">{salon.description || "View salon details and services."}</p>
          </Link></li>
        ))}</ul>
      )}
    </main></>
  );
}
