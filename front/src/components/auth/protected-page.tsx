"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { destinationForRole, logoutSession, restoreSession, type AuthenticatedUser, type UserRole } from "@/lib/auth";

interface ProtectedPageProps {
  allowedRole: UserRole;
  eyebrow: string;
  title: string;
  description: string;
}

export function ProtectedPage({ allowedRole, eyebrow, title, description }: ProtectedPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [error, setError] = useState("");

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
    return () => { active = false; };
  }, [allowedRole, router]);

  async function logout() {
    setError("");
    try {
      await logoutSession();
      router.replace("/login");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not sign out.");
    }
  }

  if (!user) return <main className="grid min-h-screen place-items-center text-stone-600">Restoring your session…</main>;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm md:p-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900">{title}</h1>
            <p className="mt-4 max-w-2xl leading-7 text-stone-600">{description}</p>
          </div>
          <button onClick={logout} className="rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-semibold hover:bg-stone-100">Sign out</button>
        </div>
        <div className="mt-10 rounded-2xl bg-stone-100 p-6">
          <p className="font-semibold text-stone-900">{user.firstName} {user.lastName}</p>
          <p className="mt-1 text-sm text-stone-600">{user.email}</p>
          <p className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{user.role.replace("_", " ")}</p>
        </div>
        {error ? <p role="alert" className="mt-5 text-sm text-red-700">{error}</p> : null}
      </section>
    </main>
  );
}
