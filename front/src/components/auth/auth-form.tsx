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
    if (isRegistration && !values.firstName) validationErrors.firstName = "First name is required.";
    if (isRegistration && !values.lastName) validationErrors.lastName = "Last name is required.";
    if (!values.phone) validationErrors.phone = "Phone number is required.";
    else if (!/^\+?[0-9]{7,15}$/.test(values.phone)) validationErrors.phone = "Enter 7 to 15 digits, optionally starting with +.";
    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) validationErrors.email = "Enter a valid email address.";
    if (!values.password) validationErrors.password = "Password is required.";
    else if (isRegistration && values.password.length < 8) validationErrors.password = "Password must contain at least 8 characters.";
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
      const user = await authRequest(mode, { method: "POST", body: JSON.stringify(body) });
      router.replace(destinationForRole(user.role));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Authentication failed.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
      {isRegistration ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" name="firstName" autoComplete="given-name" error={fieldErrors.firstName} />
          <Field label="Last name" name="lastName" autoComplete="family-name" error={fieldErrors.lastName} />
        </div>
      ) : null}
      {isRegistration ? <Field label="Email (optional)" name="email" type="email" autoComplete="email" required={false} error={fieldErrors.email} /> : null}
      <Field label="Phone number" name="phone" type="tel" autoComplete="tel" error={fieldErrors.phone} />
      <Field label="Password" name="password" type="password" autoComplete={isRegistration ? "new-password" : "current-password"} minLength={isRegistration ? 8 : undefined} error={fieldErrors.password} />

      {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <button disabled={isSubmitting} className="w-full rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white transition hover:bg-amber-900 disabled:cursor-wait disabled:opacity-60">
        {isSubmitting ? "Please wait…" : isRegistration ? "Create account" : "Sign in"}
      </button>
      <p className="text-center text-sm text-stone-600">
        {isRegistration ? "Already registered?" : "New to Salon Reserve?"}{" "}
        <Link className="font-semibold text-amber-900 underline-offset-4 hover:underline" href={isRegistration ? "/login" : "/register"}>
          {isRegistration ? "Sign in" : "Create an account"}
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

function Field({ label, name, type = "text", autoComplete, required = true, minLength, error }: FieldProps) {
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
      {error ? <span id={`${name}-error`} className="mt-2 block text-sm font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
