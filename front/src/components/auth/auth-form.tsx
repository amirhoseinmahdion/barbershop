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
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const body = isRegistration
      ? {
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          phone: form.get("phone") || undefined,
          email: form.get("email"),
          password: form.get("password"),
        }
      : { email: form.get("email"), password: form.get("password") };

    try {
      const user = await authRequest(mode, { method: "POST", body: JSON.stringify(body) });
      router.replace(destinationForRole(user.role));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Authentication failed.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      {isRegistration ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" name="firstName" autoComplete="given-name" />
          <Field label="Last name" name="lastName" autoComplete="family-name" />
        </div>
      ) : null}
      <Field label="Email" name="email" type="email" autoComplete="email" />
      {isRegistration ? <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" required={false} /> : null}
      <Field label="Password" name="password" type="password" autoComplete={isRegistration ? "new-password" : "current-password"} minLength={8} />

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
}

function Field({ label, name, type = "text", autoComplete, required = true, minLength }: FieldProps) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}
      <input
        className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-amber-800 focus:ring-2 focus:ring-amber-100"
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
      />
    </label>
  );
}
