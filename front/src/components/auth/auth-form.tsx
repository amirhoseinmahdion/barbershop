"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authRequest, destinationForRole } from "@/lib/auth";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegistration = mode === "register";
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const values = {
      firstName: String(form.get("firstName") ?? "").trim(),
      lastName: String(form.get("lastName") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    };
    const validationErrors: Record<string, string> = {};
    if (isRegistration && !values.firstName)
      validationErrors.firstName = "نام الزامی است.";
    if (isRegistration && !values.lastName)
      validationErrors.lastName = "نام خانوادگی الزامی است.";
    if (!values.phone) validationErrors.phone = "شماره تلفن الزامی است.";
    else if (!/^\+?[0-9]{7,15}$/.test(values.phone))
      validationErrors.phone =
        "شماره تلفن باید بین ۷ تا ۱۵ رقم باشد و می‌تواند با + شروع شود.";
    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email))
      validationErrors.email = "یک ایمیل معتبر وارد کنید.";
    if (!values.password) validationErrors.password = "رمز عبور الزامی است.";
    else if (isRegistration && values.password.length < 8)
      validationErrors.password =
        "رمز عبور باید حداقل ۸ نویسه داشته باشد.";
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setIsSubmitting(true);

    const body = isRegistration
      ? {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          email: values.email || undefined,
          password: values.password,
        }
      : { phone: values.phone, password: values.password };

    try {
      const user = await authRequest(mode, {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.replace(destinationForRole(user.role));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "ورود یا ثبت‌نام انجام نشد.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
      {isRegistration ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="نام"
            name="firstName"
            autoComplete="given-name"
            error={fieldErrors.firstName}
          />
          <Field
            label="نام خانوادگی"
            name="lastName"
            autoComplete="family-name"
            error={fieldErrors.lastName}
          />
        </div>
      ) : null}
      {isRegistration ? (
        <Field
          label="ایمیل (اختیاری)"
          name="email"
          type="email"
          autoComplete="email"
          required={false}
          error={fieldErrors.email}
        />
      ) : null}
      <Field
        label="شماره تلفن"
        name="phone"
        type="tel"
        autoComplete="tel"
        error={fieldErrors.phone}
      />
      <Field
        label="رمز عبور"
        name="password"
        type="password"
        autoComplete={isRegistration ? "new-password" : "current-password"}
        minLength={isRegistration ? 8 : undefined}
        error={fieldErrors.password}
      />

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <button
        disabled={isSubmitting}
        className="w-full rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white transition hover:bg-amber-900 disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting
          ? "لطفاً صبر کنید…"
          : isRegistration
            ? "ساخت حساب کاربری"
            : "ورود"}
      </button>
      <p className="text-center text-sm text-stone-600">
        {isRegistration ? "قبلاً ثبت‌نام کرده‌اید؟" : "هنوز حساب کاربری ندارید؟"}{" "}
        <Link
          className="font-semibold text-amber-900 underline-offset-4 hover:underline"
          href={isRegistration ? "/login" : "/register"}
        >
          {isRegistration ? "ورود" : "ساخت حساب کاربری"}
        </Link>
      </p>
    </form>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  error?: string;
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
  minLength,
  error,
}: FieldProps) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}
      <input
        className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none transition ${error ? "border-red-500 text-red-900 focus:border-red-600 focus:ring-2 focus:ring-red-100" : "border-stone-300 focus:border-amber-800 focus:ring-2 focus:ring-amber-100"}`}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error ? (
        <span
          id={`${name}-error`}
          className="mt-2 block text-sm font-medium text-red-600"
        >
          {error}
        </span>
      ) : null}
    </label>
  );
}
