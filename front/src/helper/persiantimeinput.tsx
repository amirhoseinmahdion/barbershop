import { useState } from "react";

export function PersianTimeInput({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  const initialHour = defaultValue
    ? String(Number(defaultValue.slice(0, 2)) % 12 || 12)
    : "";
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(
    defaultValue ? defaultValue.slice(3, 5) : "00",
  );
  const [period, setPeriod] = useState<"AM" | "PM">(
    defaultValue && Number(defaultValue.slice(0, 2)) >= 12 ? "PM" : "AM",
  );

  const hour24 = hour ? (Number(hour) % 12) + (period === "PM" ? 12 : 0) : null;
  const value =
    hour24 === null ? "" : `${String(hour24).padStart(2, "0")}:${minute}`;

  return (
    <fieldset className="text-sm font-medium text-stone-700">
      <legend>{label}</legend>
      <input type="hidden" name={name} value={value} />
      <div className="mt-2 grid grid-cols-[1fr_1fr_1.5fr] gap-2" dir="rtl">
        <select
          aria-label={`${label} ساعت`}
          value={hour}
          onChange={(event) => setHour(event.target.value)}
          className="rounded-xl border border-stone-300 bg-white px-2 py-3"
        >
          <option value="">--</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
            <option key={item} value={item}>
              {item.toLocaleString("fa-IR")}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} دقیقه`}
          value={minute}
          onChange={(event) => setMinute(event.target.value)}
          disabled={!hour}
          className="rounded-xl border border-stone-300 bg-white px-2 py-3 disabled:opacity-50"
        >
          {Array.from({ length: 60 }, (_, index) =>
            String(index).padStart(2, "0"),
          ).map((item) => (
            <option key={item} value={item}>
              {Number(item).toLocaleString("fa-IR", {
                minimumIntegerDigits: 2,
              })}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} بازه روز`}
          value={period}
          onChange={(event) => setPeriod(event.target.value as "AM" | "PM")}
          disabled={!hour}
          className="rounded-xl border border-stone-300 bg-white px-2 py-3 disabled:opacity-50"
        >
          <option value="AM">قبل‌ازظهر</option>
          <option value="PM">بعدازظهر</option>
        </select>
      </div>
    </fieldset>
  );
}
