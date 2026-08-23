"use client";
import Link from "next/link";
import { useState } from "react";
import { apiRequest, ApiRequestError } from "@/lib/api";
import type { SalonService } from "@/types/salon";
export function ReservationPicker({
  salonId,
  services,
}: {
  salonId: string;
  services: SalonService[];
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function findTimes() {
    setError("");
    setMessage("");
    if (!serviceId || !date) {
      setError("Choose a service and date.");
      return;
    }
    try {
      const p = await apiRequest<{ data: { slots: string[] } }>(
        `salons/${salonId}/availability?serviceId=${serviceId}&date=${date}`,
      );
      setSlots(p.data.slots);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load times.");
    }
  }
  async function reserve(startsAt: string) {
    setError("");
    try {
      await apiRequest("bookings", {
        method: "POST",
        body: JSON.stringify({ salonId, serviceId, startsAt }),
      });
      setMessage("Reservation confirmed.");
      setSlots((current) => current.filter((slot) => slot !== startsAt));
    } catch (e) {
      setError(
        e instanceof ApiRequestError && e.status === 401
          ? "Please sign in as a customer before reserving."
          : e instanceof Error
            ? e.message
            : "Could not reserve.",
      );
    }
  }
  if (services.length === 0) return null;
  return (
    <section className="mt-10 rounded-3xl border border-stone-200 bg-white p-6 md:p-8">
      <h2 className="text-2xl font-bold">Reserve an appointment</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Service
          <select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setSlots([]);
            }}
            className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
               {s.name}  — {s.durationMinutes + "دقیقه"} 
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSlots([]);
            }}
            className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
          />
        </label>
      </div>
      <button
        onClick={() => void findTimes()}
        className="mt-4 rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white"
      >
        Show available times
      </button>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}{" "}
          {error.startsWith("Please sign") ? (
            <Link href="/login" className="underline">
              Sign in
            </Link>
          ) : null}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-4 text-emerald-800">
          {message}
        </p>
      ) : null}
      {slots.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {slots.map((slot) => (
            <button
              key={slot}
              onClick={() => void reserve(slot)}
              className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 font-semibold text-amber-900"
            >
              {new Date(slot).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </button>
          ))}
        </div>
      ) : date ? (
        <p className="mt-4 text-sm text-stone-600">
          No available times for this date.
        </p>
      ) : null}
    </section>
  );
}
