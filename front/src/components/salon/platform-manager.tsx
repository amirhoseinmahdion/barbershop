"use client";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Salon } from "@/types/salon";

export function PlatformManager() {
  const [salons, setSalons] = useState<Salon[]>([]); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const load = useCallback(async () => { const result = await apiRequest<{ data: Salon[] }>("platform/salons"); setSalons(result.data); }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load().catch((e: Error) => setError(e.message)), 0); return () => clearTimeout(timer); }, [load]);
  async function createSalon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const formElement = event.currentTarget; const form = new FormData(formElement);
    try { await apiRequest("platform/salons", { method: "POST", body: JSON.stringify({
      name: form.get("name"), slug: form.get("slug"), audience: form.get("audience"), streetAddress: form.get("streetAddress"),
    }) }); formElement.reset(); setMessage("Salon created."); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Could not create salon."); }
  }
  async function assign(event: FormEvent<HTMLFormElement>, salonId: string) {
    event.preventDefault(); setError(""); const phone = new FormData(event.currentTarget).get("adminPhone");
    try { await apiRequest(`platform/salons/${salonId}/admins`, { method: "POST", body: JSON.stringify({ phone }) }); setMessage("Salon administrator assigned."); } catch (e) { setError(e instanceof Error ? e.message : "Could not assign administrator."); }
  }
  return <div className="mt-10 space-y-8">
    {message ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{message}</p> : null}{error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p> : null}
    <form onSubmit={createSalon} className="rounded-2xl border border-stone-200 p-6"><h2 className="text-xl font-bold">Add hair salon</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
      <Field name="name" label="Salon name" /><Field name="slug" label="URL name" placeholder="central-salon" /><Field name="streetAddress" label="Address" />
      <label className="text-sm font-medium">Audience<select name="audience" className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"><option value="UNISEX">Unisex</option><option value="MEN">Men</option><option value="WOMEN">Women</option></select></label>
    </div><button className="mt-5 rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white">Create salon</button></form>
    <section><h2 className="text-xl font-bold">Salon list</h2>{salons.length === 0 ? <p className="mt-4">No salons.</p> : <ul className="mt-4 space-y-4">{salons.map((salon) => <li key={salon.id} className="rounded-2xl bg-stone-100 p-5"><p className="font-bold">{salon.name}</p><p className="text-sm text-stone-600">{salon.streetAddress}, {salon.city}</p><form onSubmit={(event) => void assign(event, salon.id)} className="mt-4 flex gap-2"><input name="adminPhone" required placeholder="Admin phone number" className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2" /><button className="rounded-xl bg-amber-800 px-4 py-2 text-sm font-semibold text-white">Assign admin</button></form></li>)}</ul>}</section>
  </div>;
}
function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label className="text-sm font-medium">{label}<input {...props} required className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3" /></label>; }
