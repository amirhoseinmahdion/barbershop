"use client";

import Link from "next/link";
import { useState } from "react";
import PersianDatePicker from "@/components/helper/PersianDatePicker";
import { apiRequest, ApiRequestError } from "@/lib/api";
import type { SalonService } from "@/types/salon";
import { snackbar } from "@/components/helper/snackbar";

export function ReservationPicker({ salonId, services }: { salonId: string; services: SalonService[] }) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");




  async function findTimes(nextDate = date, nextServiceId = serviceId) {
    setError("");
    setMessage("");
    setSelectedSlot("");
    setSlots([]);
    if (!nextServiceId || !nextDate) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const payload = await apiRequest<{ data: { slots: string[] } }>(
        `salons/${salonId}/availability?serviceId=${nextServiceId}&date=${nextDate}`,
      );
      setSlots(payload.data.slots);
    } catch (caught) {
      setSlots([]);
      snackbar(caught instanceof Error ? caught.message : "زمان‌های آزاد دریافت نشد.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function reserve() {
    if (!selectedSlot) return;
    setError("");
    setMessage("");
    setReserving(true);
    try {
      await apiRequest("bookings", { method: "POST", body: JSON.stringify({ salonId, serviceId, startsAt: selectedSlot }) });
      await findTimes(date, serviceId);
      snackbar("رزرو شما با موفقیت ثبت شد.", "success");
    } catch (caught) {
      snackbar(
        caught instanceof ApiRequestError && caught.status === 401
          ? "برای رزرو نوبت ابتدا به‌عنوان مشتری وارد شوید."
          : caught instanceof Error
            ? caught.message
            : "رزرو نوبت انجام نشد.",
        "error",
      );
      await findTimes(date, serviceId);
    } finally {
      setReserving(false);
    }
  }

  if (services.length === 0) return null;
  const selectedService = services.find((service) => service.id === serviceId);

  return (
    <section className="mt-10 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <div className="bg-stone-900 px-6 py-5 text-white md:px-8">
        <p className="text-xs font-bold text-amber-300">رزرو آنلاین</p>
        <h2 className="mt-1 text-2xl font-bold">رزرو نوبت سالن</h2>
      </div>
      <div className="space-y-6 p-6 md:p-8">
        <label className="block text-sm font-bold text-stone-800">
          خدمت
          <select
            value={serviceId}
            onChange={(event) => {
              const nextServiceId = event.target.value;
              setServiceId(nextServiceId);
              setSlots([]);
              setSelectedSlot("");
              setHasSearched(false);
              if (date) void findTimes(date, nextServiceId);
            }}
            className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
          >
            {services.map((service) => <option key={service.id} value={service.id}>{service.name} — {service.durationMinutes} دقیقه</option>)}
          </select>
        </label>

        <PersianDatePicker value={date} disabled={loading || reserving} onChange={(nextDate) => { setDate(nextDate); void findTimes(nextDate, serviceId); }} />

        {loading ? <p role="status" className="text-sm text-stone-600">در حال دریافت زمان‌های آزاد…</p> : null}
        {!loading && slots.length > 0 ? (
          <div dir="rtl">
            <p className="text-sm font-bold text-stone-800">ساعت رزرو</p>
            <p className="mt-1 text-xs text-stone-500">زمان‌های پرشده نمایش داده نمی‌شوند.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {slots.map((slot) => {
                const selected = selectedSlot === slot;
                return <button key={slot} type="button" aria-pressed={selected} onClick={() => setSelectedSlot(slot)} className={`rounded-xl border px-3 py-3 font-bold transition ${selected ? "border-amber-700 bg-amber-700 text-white shadow-md" : "border-stone-200 bg-stone-50 text-stone-800 hover:border-amber-500 hover:bg-amber-50"}`}>{new Date(slot).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</button>;
              })}
            </div>
          </div>
        ) : null}
        {!loading && hasSearched && slots.length === 0 && !error ? <p className="rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-600">برای این تاریخ زمان آزادی وجود ندارد.</p> : null}
        {selectedSlot ? <div dir="rtl" className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900"><p className="font-bold">زمان انتخاب‌شده</p><p className="mt-1">{new Date(selectedSlot).toLocaleString("fa-IR", { dateStyle: "full", timeStyle: "short" })}{selectedService ? ` — ${selectedService.durationMinutes} دقیقه` : ""}</p></div> : null}
        {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error} {error.startsWith("برای رزرو") ? <Link href="/login" className="font-bold underline">ورود</Link> : null}</p> : null}
        {message ? <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}
        <button type="button" disabled={!selectedSlot || reserving} onClick={() => void reserve()} className="w-full rounded-xl bg-stone-900 px-5 py-3 font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-40">{reserving ? "در حال ثبت رزرو…" : "تأیید و ثبت رزرو"}</button>
      </div>
    </section>
  );
}
