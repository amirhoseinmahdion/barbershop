"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Salon, SalonService } from "@/types/salon";

interface AdminBooking {
  id: string;
  startsAt: string;
  endsAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  serviceName: string;
  durationMinutes: number;
  customer: { firstName: string; lastName: string; phone: string };
}

interface WeeklyPeriod { id?: string; dayOfWeek: number; opensAt: string; closesAt: string }
const iranianWeekDays = [
  { dayOfWeek: 6, label: "شنبه" },
  { dayOfWeek: 0, label: "یکشنبه" },
  { dayOfWeek: 1, label: "دوشنبه" },
  { dayOfWeek: 2, label: "سه‌شنبه" },
  { dayOfWeek: 3, label: "چهارشنبه" },
  { dayOfWeek: 4, label: "پنجشنبه" },
  { dayOfWeek: 5, label: "جمعه" },
] as const;

export function SalonManager() {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<SalonService[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [weeklyPeriods, setWeeklyPeriods] = useState<WeeklyPeriod[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [salonPayload, servicePayload, bookingPayload, schedulePayload] = await Promise.all([
        apiRequest<{ data: { salon: Salon } }>("admin/salon"),
        apiRequest<{ data: SalonService[] }>("admin/services"),
        apiRequest<{ data: AdminBooking[] }>("admin/bookings"),
        apiRequest<{ data: { periods: WeeklyPeriod[] } }>("admin/schedule/weekly"),
      ]);
      setSalon(salonPayload.data.salon);
      setServices(servicePayload.data);
      setBookings(bookingPayload.data);
      setWeeklyPeriods(schedulePayload.data.periods);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "اطلاعات مدیریت سالن دریافت نشد.",
      );
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function updateSalon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const payload = await apiRequest<{ data: { salon: Salon } }>(
        "admin/salon",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: form.get("name"),
            description: form.get("description"),
            streetAddress: form.get("streetAddress"),
            city: form.get("city"),
            phone: form.get("phone") || null,
            email: form.get("salonEmail") || null,
          }),
        },
      );
      setSalon(payload.data.salon);
      setMessage("پروفایل سالن ذخیره شد.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "پروفایل سالن ذخیره نشد.",
      );
    }
  }

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await apiRequest("admin/services", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("serviceName"),
          description: form.get("serviceDescription"),
          durationMinutes: Number(form.get("durationMinutes")),
        }),
      });
      formElement.reset();
      setMessage("خدمت جدید ایجاد شد.");
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "خدمت ایجاد نشد.",
      );
    }
  }

  async function setServiceState(service: SalonService, isActive: boolean) {
    setError("");
    setMessage("");
    try {
      await apiRequest(`admin/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      setMessage(isActive ? "خدمت فعال شد." : "خدمت غیرفعال شد.");
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "خدمت ویرایش نشد.",
      );
    }
  }

  async function saveWeeklySchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const periods = iranianWeekDays.flatMap(({ dayOfWeek }) => {
      const opensAt = String(form.get(`opens-${dayOfWeek}`) ?? "");
      const closesAt = String(form.get(`closes-${dayOfWeek}`) ?? "");
      return opensAt && closesAt ? [{ dayOfWeek, opensAt, closesAt }] : [];
    });
    try {
      const payload = await apiRequest<{ data: { periods: WeeklyPeriod[] } }>("admin/schedule/weekly", {
        method: "PUT",
        body: JSON.stringify({ periods }),
      });
      setWeeklyPeriods(payload.data.periods);
      setMessage("ساعت کاری هفتگی ذخیره شد.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ساعت کاری ذخیره نشد.");
    }
  }

  if (!salon && !error)
    return <p className="mt-10 text-stone-600">در حال دریافت تنظیمات سالن…</p>;

  return (
    <div className="mt-10 space-y-8">
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {message}
        </p>
      ) : null}
      {salon ? (
        <form
          onSubmit={updateSalon}
          className="rounded-2xl border border-stone-200 p-6"
        >
          <h2 className="text-xl font-bold">پروفایل سالن</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input name="name" label="نام سالن" defaultValue={salon.name} />
            <Input name="city" label="شهر" defaultValue={salon.city} />
            <Input
              name="streetAddress"
              label="نشانی"
              defaultValue={salon.streetAddress}
            />
            <Input
              name="phone"
              label="شماره تلفن"
              defaultValue={salon.phone ?? ""}
              required={false}
            />
         
            <label className="sm:col-span-2 text-sm font-medium text-stone-700">
              توضیحات
              <textarea
                name="description"
                defaultValue={salon.description}
                rows={4}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </label>
          </div>
          <button className="mt-5 rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white">
            ذخیره پروفایل سالن
          </button>
        </form>
      ) : null}

      <section className="rounded-2xl border border-stone-200 p-6">
        <h2 className="text-xl font-bold">خدمات</h2>
        {services.length === 0 ? (
          <p className="mt-4 text-sm text-stone-600">هنوز خدمتی ثبت نشده است.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex flex-col gap-3 rounded-xl bg-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-sm text-stone-600">
                    {service.durationMinutes} دقیقه ·{" "}
                    {service.isActive ? "فعال" : "غیرفعال"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    void setServiceState(service, !service.isActive)
                  }
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold"
                >
                  {service.isActive ? "غیرفعال کردن" : "فعال کردن"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={saveWeeklySchedule} className="rounded-2xl border border-stone-200 p-6">
        <h2 className="text-xl font-bold">ساعت کاری هفتگی</h2>
        <p className="mt-2 text-sm text-stone-600">برای روزهای تعطیل، هر دو ساعت را خالی بگذارید.</p>
        <div className="mt-5 space-y-3">
          {iranianWeekDays.map(({ dayOfWeek, label }) => {
            const period = weeklyPeriods.find((item) => item.dayOfWeek === dayOfWeek);
            return (
              <div key={dayOfWeek} className="grid gap-3 rounded-xl bg-stone-100 p-4 sm:grid-cols-[8rem_1fr_1fr] sm:items-end">
                <span className="font-semibold">{label}</span>
                <PersianTimeInput name={`opens-${dayOfWeek}`} label="شروع" defaultValue={period?.opensAt.slice(0, 5) ?? ""} />
                <PersianTimeInput name={`closes-${dayOfWeek}`} label="پایان" defaultValue={period?.closesAt.slice(0, 5) ?? ""} />
              </div>
            );
          })}
        </div>
        <button className="mt-5 rounded-xl bg-amber-800 px-5 py-3 font-semibold text-white">ذخیره ساعت کاری</button>
      </form>

      <section className="rounded-2xl border border-stone-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">رزروها</h2>
            <p className="mt-1 text-sm text-stone-600">نوبت‌های ثبت‌شده مشتریان سالن شما</p>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold">به‌روزرسانی</button>
        </div>
        {bookings.length === 0 ? (
          <p className="mt-5 rounded-xl bg-stone-100 p-4 text-sm text-stone-600">هنوز رزروی ثبت نشده است.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {bookings.map((booking) => (
              <li key={booking.id} className="grid gap-3 rounded-xl bg-stone-100 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-bold">{booking.serviceName}</p>
                  <p className="mt-1 text-sm text-stone-700">{booking.customer.firstName} {booking.customer.lastName} · {booking.customer.phone}</p>
                  <p className="mt-1 text-sm text-stone-600">{new Date(booking.startsAt).toLocaleString("fa-IR", { dateStyle: "full", timeStyle: "short" })} · {booking.durationMinutes} دقیقه</p>
                </div>
                <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">{{ PENDING: "در انتظار", CONFIRMED: "تأییدشده", CANCELLED: "لغوشده", COMPLETED: "انجام‌شده", NO_SHOW: "عدم مراجعه" }[booking.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        onSubmit={createService}
        className="rounded-2xl border border-stone-200 p-6"
      >
        <h2 className="text-xl font-bold">افزودن خدمت</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input name="serviceName" label="نام خدمت" />
          <Input
            name="durationMinutes"
            label="مدت‌زمان (دقیقه)"
            type="number"
            min="5"
          />
          <label className="sm:col-span-2 text-sm font-medium text-stone-700">
            توضیحات
            <textarea
              name="serviceDescription"
              rows={3}
              className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
            />
          </label>
        </div>
        <button className="mt-5 rounded-xl bg-amber-800 px-5 py-3 font-semibold text-white">
          ایجاد خدمت
        </button>
      </form>
    </div>
  );
}

function PersianTimeInput({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  const initialHour = defaultValue ? String(Number(defaultValue.slice(0, 2)) % 12 || 12) : "";
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(defaultValue ? defaultValue.slice(3, 5) : "00");
  const [period, setPeriod] = useState<"AM" | "PM">(defaultValue && Number(defaultValue.slice(0, 2)) >= 12 ? "PM" : "AM");

  const hour24 = hour ? (Number(hour) % 12) + (period === "PM" ? 12 : 0) : null;
  const value = hour24 === null ? "" : `${String(hour24).padStart(2, "0")}:${minute}`;

  return (
    <fieldset className="text-sm font-medium text-stone-700">
      <legend>{label}</legend>
      <input type="hidden" name={name} value={value} />
      <div className="mt-2 grid grid-cols-[1fr_1fr_1.5fr] gap-2" dir="rtl">
        <select aria-label={`${label} ساعت`} value={hour} onChange={(event) => setHour(event.target.value)} className="rounded-xl border border-stone-300 bg-white px-2 py-3">
          <option value="">--</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => <option key={item} value={item}>{item.toLocaleString("fa-IR")}</option>)}
        </select>
        <select aria-label={`${label} دقیقه`} value={minute} onChange={(event) => setMinute(event.target.value)} disabled={!hour} className="rounded-xl border border-stone-300 bg-white px-2 py-3 disabled:opacity-50">
          {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0")).map((item) => <option key={item} value={item}>{Number(item).toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}</option>)}
        </select>
        <select aria-label={`${label} بازه روز`} value={period} onChange={(event) => setPeriod(event.target.value as "AM" | "PM")} disabled={!hour} className="rounded-xl border border-stone-300 bg-white px-2 py-3 disabled:opacity-50">
          <option value="AM">قبل‌ازظهر</option>
          <option value="PM">بعدازظهر</option>
        </select>
      </div>
    </fieldset>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="text-sm font-medium text-stone-700">
      {label}
      <input
        {...props}
        required={props.required ?? true}
        className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
      />
    </label>
  );
}
