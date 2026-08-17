import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-stone-900">Salon Reserve</Link>
        <div className="flex items-center gap-5 text-sm font-semibold text-stone-700">
          <Link href="/salons" className="hover:text-amber-900">Salons</Link>
          <Link href="/login" className="hover:text-amber-900">Sign in</Link>
        </div>
      </nav>
    </header>
  );
}
