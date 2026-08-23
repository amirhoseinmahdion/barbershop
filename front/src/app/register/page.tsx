import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">
          رزرو سالن
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          حساب کاربری خود را بسازید
        </h1>
        <p className="mt-3 text-stone-600">
          ثبت‌نام کنید، سالن موردنظر را پیدا کنید و آنلاین نوبت بگیرید.
        </p>
        <AuthForm mode="register" />
      </section>
    </main>
  );
}
