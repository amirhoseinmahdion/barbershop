"use client";

import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import gregorian from "react-date-object/calendars/gregorian";
import persianFa from "react-date-object/locales/persian_fa";
import gregorianEn from "react-date-object/locales/gregorian_en";
import { getCurrentBookingWeek } from "@/components/booking/booking-week";
import { PersianDatePickerProps } from "@/types/type";



export default function PersianDatePicker({ value, onChange, disabled = false }: PersianDatePickerProps) {
  const { saturday, friday } = getCurrentBookingWeek();
  const firstDayOfWeek = new DateObject({ date: saturday, calendar: gregorian }).convert(persian, persianFa);
  const lastDayOfWeek = new DateObject({ date: friday, calendar: gregorian }).convert(persian, persianFa);
  const selectedValue = value
    ? new DateObject({ date: value, format: "YYYY-MM-DD", calendar: gregorian }).convert(persian)
    : null;

  function selectDate(date: DateObject | null) {
    if (!date) return;
    onChange(new DateObject(date).convert(gregorian, gregorianEn).format("YYYY-MM-DD"));
  }

  return (
    <div dir="rtl" className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <label className="block text-sm font-bold text-stone-800" htmlFor="reservation-date">تاریخ رزرو</label>
      <p className="mt-1 text-xs text-stone-500">هفته جاری، از شنبه تا جمعه</p>
      <DatePicker
        id="reservation-date"
        value={selectedValue}
        onChange={selectDate}
        calendar={persian}
        locale={persianFa}
        weekStartDayIndex={0}
        minDate={firstDayOfWeek}
        maxDate={lastDayOfWeek}
        format="dddd، YYYY/MM/DD"
        calendarPosition="bottom-right"
        placeholder="انتخاب تاریخ"
        disabled={disabled}
        inputClass="mt-3 w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-right text-stone-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}
