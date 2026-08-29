"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import {
  destinationForRole,
  logoutSession,
  restoreSession,
  type AuthenticatedUser,
} from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { SalonManager } from "@/components/salon/salon-manager";
import { PlatformManager } from "@/components/salon/platform-manager";
import { ProtectedPageProps } from "@/types/type";



export function ProtectedPage({
  allowedRole,
  eyebrow,
  manageSalon = false,
  managePlatform = false,
}: ProtectedPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    restoreSession()
      .then((sessionUser) => {
        if (!active) return;
        if (sessionUser.role !== allowedRole) {
          router.replace(destinationForRole(sessionUser.role));
          return;
        }
        setUser(sessionUser);
      })
      .catch(() => {
        if (active) router.replace("/login");
      });
    return () => {
      active = false;
    };
  }, [allowedRole, router]);

  async function logout() {
    setError("");
    try {
      await logoutSession();
      router.replace("/login");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "خروج از حساب انجام نشد.",
      );
    }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const payload = await apiRequest<{ data: { user: AuthenticatedUser } }>(
        "users/me",
        {
          method: "PATCH",
          body: JSON.stringify({
            firstName: form.get("firstName"),
            lastName: form.get("lastName"),
            phone: form.get("phone") || null,
          }),
        },
      );
      setUser(payload.data.user);
      setMessage("پروفایل ذخیره شد.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "پروفایل ذخیره نشد.",
      );
    }
  }

  if (!user)
    return (
      <main className="grid min-h-screen place-items-center text-stone-600">
        در حال بازیابی نشست شما…
      </main>
    );

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm md:p-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">
              {eyebrow}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-semibold hover:bg-stone-100"
          >
            خروج
          </button>
        </div>
        <form
          onSubmit={updateProfile}
          className="mt-10 rounded-2xl bg-stone-100 p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold">پروفایل کاربری</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
              {
                {
                  CUSTOMER: "مشتری",
                  SALON_ADMIN: "مدیر سالن",
                  SUPER_ADMIN: "مدیر کل",
                }[user.role]
              }
            </span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium">
              نام
              <input
                name="firstName"
                defaultValue={user.firstName}
                required
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3"
              />
            </label>
            <label className="text-sm font-medium">
              نام خانوادگی
              <input
                name="lastName"
                defaultValue={user.lastName}
                required
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3"
              />
            </label>
            <label className="text-sm font-medium">
              شماره تلفن
              <input
                name="phone"
                defaultValue={user.phone ?? ""}
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3"
              />
            </label>
          </div>
          <button className="mt-5 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white">
            ذخیره پروفایل
          </button>
        </form>
        {manageSalon ? <SalonManager /> : null}
        {managePlatform ? <PlatformManager /> : null}
        {message ? (
          <p
            role="status"
            className="mt-5 text-sm font-medium text-emerald-800"
          >
            {message}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-5 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
