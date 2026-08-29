import { audiences, benefits } from "@/constant/constant";
import { BookingPreview } from "@/components/helper/function";
import { ArrowLeftIcon, CheckIcon, SparkleIcon } from "@/components/helper/icon";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f5f0] text-stone-900">
      <header className="relative z-20 border-b border-stone-900/10 bg-[#f8f5f0]/90 backdrop-blur">
        <nav
          aria-label="ناوبری اصلی"
          className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"
        >
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="صفحه اصلی وقت تو"
          >
            <span className="grid size-10 place-items-center rounded-full bg-stone-900 text-white shadow-sm">
              <SparkleIcon className="size-5" />
            </span>
            <span className="text-lg font-black tracking-tight">وقتِ تو</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/salons"
              className="hidden px-3 py-2 text-sm font-bold text-stone-600 transition hover:text-stone-950 sm:block"
            >
              مشاهده سالن‌ها
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-800 transition hover:border-stone-500 hover:bg-stone-50 sm:px-5"
            >
              ورود
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative isolate">
        <div className="pointer-events-none absolute -start-48 top-8 -z-10 size-96 rounded-full bg-amber-200/45 blur-3xl" />
        <div className="pointer-events-none absolute -end-48 bottom-0 -z-10 size-[28rem] rounded-full bg-rose-200/45 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-900/15 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900">
              <span className="size-2 rounded-full bg-emerald-500" />
              رزرو آنلاین، بدون تماس و انتظار
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.25] tracking-[-0.035em] text-stone-950 sm:text-5xl lg:text-7xl lg:leading-[1.18]">
              سالن مناسب تو،
              <span className="relative mt-1 block w-fit text-amber-900">
                درست سر وقت.
                <svg
                  aria-hidden="true"
                  className="absolute -bottom-2 start-0 h-3 w-full text-amber-500/60"
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 9C75 1 221 1 298 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-stone-600 sm:text-lg">
              سالن‌های اطرافت را پیدا کن، خدمات و زمان‌های آزاد را ببین و نوبت
              بعدی‌ات را سریع و مطمئن رزرو کن.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/salons"
                className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-stone-950 px-7 py-3.5 font-bold text-white shadow-lg shadow-stone-900/15 transition hover:-translate-y-0.5 hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
              >
                پیدا کردن سالن{" "}
                <ArrowLeftIcon className="size-5 transition group-hover:-translate-x-1" />
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-13 items-center justify-center rounded-full border border-stone-300 bg-white/70 px-7 py-3.5 font-bold text-stone-800 transition hover:-translate-y-0.5 hover:border-stone-500 hover:bg-white"
              >
                ساخت حساب رایگان
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-stone-500">
              <span className="flex items-center gap-2">
                <CheckIcon /> نمایش زمان‌های آزاد
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon /> مقایسه آسان خدمات
              </span>
            </div>
          </div>
          <BookingPreview />
        </div>
      </section>

      <section
        aria-labelledby="audience-title"
        className="border-y border-stone-900/10 bg-white/65"
      >
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold text-amber-900">انتخاب سریع</p>
              <h2
                id="audience-title"
                className="mt-1 text-2xl font-black tracking-tight"
              >
                چه سالنی می‌خواهید؟
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {audiences.map((audience) => (
                <Link
                  key={audience.value}
                  href={`/salons?audience=${audience.value}`}
                  className="group flex items-center justify-between gap-5 rounded-2xl border border-stone-200 bg-white px-5 py-4 font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                >
                  <span className="text-amber-700" aria-hidden="true">
                    {audience.icon}
                  </span>
                  {audience.label}
                  <ArrowLeftIcon className="size-4 text-stone-400 transition group-hover:-translate-x-1 group-hover:text-amber-800" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="benefits-title"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold text-amber-900">
            همه‌چیز برای یک انتخاب خوب
          </p>
          <h2
            id="benefits-title"
            className="mt-3 text-3xl font-black tracking-tight sm:text-4xl"
          >
            از جست‌وجو تا رزرو، ساده و روشن
          </h2>
        </div>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {benefits.map(({ title, description, icon: Icon }, index) => (
            <li
              key={title}
              className="rounded-3xl border border-stone-200 bg-white p-7 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-900">
                  <Icon className="size-6" />
                </span>
                <span className="text-sm font-black text-stone-300">
                  ۰{index + 1}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
