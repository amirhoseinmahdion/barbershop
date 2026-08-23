import Link from "next/link";

const foundations = [
  "پیدا کردن سالن‌های مردانه، زنانه و مشترک",
  "انتخاب خدمات و زمان‌های آزاد نوبت",
  "مدیریت برنامه کاری و رزروها از پنل سالن",
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <section className="w-full rounded-3xl border border-stone-200 bg-white p-8 shadow-sm md:p-14">
     
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-stone-900 md:text-6xl">
          ساده‌ترین راه برای پیدا کردن سالن و رزرو نوبت بعدی شما
        </h1>
    
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white hover:bg-amber-900"
          >
            ساخت حساب کاربری
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 hover:bg-stone-100"
          >
            ورود
          </Link>
        </div>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {foundations.map((foundation) => (
            <li
              key={foundation}
              className="rounded-2xl bg-stone-100 p-5 text-sm leading-6 text-stone-700"
            >
              {foundation}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
