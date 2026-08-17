import Link from "next/link";
export default function SalonNotFound() {
  return <main className="grid min-h-screen place-items-center px-6"><div className="text-center"><h1 className="text-3xl font-bold">Salon not found</h1><p className="mt-3 text-stone-600">This salon is unavailable or no longer active.</p><Link href="/salons" className="mt-6 inline-block font-semibold text-amber-900 hover:underline">Browse salons</Link></div></main>;
}
