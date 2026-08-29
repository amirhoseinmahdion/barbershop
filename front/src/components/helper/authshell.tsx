import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, CheckIcon, SparkleIcon } from "./icon";

const highlights = [
  "مشاهده سالن‌های مردانه، زنانه و مشترک",
  "مقایسه خدمات و انتخاب زمان آزاد",
  "مدیریت ساده نوبت‌ها در حساب کاربری",
];

export function AuthShell({ title, description, children }: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f8f5f0] p-3 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_24px_80px_-36px_rgba(41,37,36,0.35)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14 lg:py-16">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 inline-flex items-center gap-3 text-stone-900" aria-label="بازگشت به صفحه اصلی">
              <span className="grid size-10 place-items-center rounded-full bg-stone-950 text-white"><SparkleIcon /></span>
              <span className="text-lg font-black">وقتِ تو</span>
            </Link>
            <p className="text-sm font-bold text-amber-800">حساب کاربری</p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-stone-950 sm:text-4xl">{title}</h1>
            <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">{description}</p>
            {children}
          </div>
        </section>

        <aside className="relative hidden overflow-hidden bg-stone-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -end-28 -top-28 size-80 rounded-full bg-amber-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -start-24 size-96 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-amber-200"><span className="size-2 rounded-full bg-emerald-400" />رزرو آنلاین، سریع و مطمئن</span>
            <h2 className="mt-8 max-w-lg text-4xl font-black leading-[1.4] tracking-tight xl:text-5xl">نوبت بعدی شما، فقط چند کلیک فاصله دارد.</h2>
            <p className="mt-5 max-w-lg leading-8 text-stone-300">حساب شما همه انتخاب‌ها و نوبت‌ها را در یک جای امن و همیشه در دسترس نگه می‌دارد.</p>
          </div>
          <ul className="relative mt-12 space-y-4">
            {highlights.map((highlight) => (
              <li key={highlight} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-medium text-stone-200">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-amber-400 text-stone-950"><CheckIcon /></span>
                {highlight}
              </li>
            ))}
          </ul>
          <Link href="/salons" className="relative mt-10 inline-flex items-center gap-2 text-sm font-bold text-amber-200 transition hover:text-amber-100">مشاهده سالن‌ها<ArrowLeftIcon /></Link>
        </aside>
      </div>
    </main>
  );
}

