import { CalendarIcon, CheckIcon, SparkleIcon } from "./icon";

export function BookingPreview() {
  const dates = [
    { day: "ش", date: "۲۴" },
    { day: "ی", date: "۲۵" },
    { day: "د", date: "۲۶", active: true },
    { day: "س", date: "۲۷" },
  ];
  return (
    <div
      className="relative mx-auto w-full max-w-lg"
      aria-label="نمونه انتخاب زمان رزرو"
    >
      <div className="absolute -end-4 -top-5 size-24 rounded-full bg-amber-300/50 blur-2xl" />
      <div className="relative rotate-1 rounded-[2rem] border border-white/80 bg-white p-4 shadow-[0_30px_80px_-30px_rgba(41,37,36,0.35)] sm:p-6">
        <div className="rounded-[1.4rem] bg-stone-950 p-5 text-white sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-300">رزرو جدید</p>
              <p className="mt-1 text-lg font-black">انتخاب زمان مناسب</p>
            </div>
            <span className="grid size-11 place-items-center rounded-full bg-white/10">
              <CalendarIcon className="size-5" />
            </span>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-2 text-center text-xs">
            {dates.map((item) => (
              <div
                key={item.date}
                className={`rounded-2xl px-2 py-3 ${item.active ? "bg-amber-400 font-black text-stone-950" : "bg-white/8 text-stone-300"}`}
              >
                <span className="block opacity-70">{item.day}</span>
                <span className="mt-1 block text-base">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-1 pb-1 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black">زمان‌های آزاد</p>
              <p className="mt-1 text-xs text-stone-500">دوشنبه، ۲۶ شهریور</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              ۴ زمان
            </span>
          </div>
          <div
            className="mt-5 grid grid-cols-3 gap-2 text-center text-sm font-bold"
            dir="ltr"
          >
            {["10:00", "11:30", "14:00", "15:30", "17:00", "18:30"].map(
              (time, index) => (
                <span
                  key={time}
                  className={`rounded-xl border px-2 py-3 ${index === 3 ? "border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-100" : index > 3 ? "border-stone-100 bg-stone-50 text-stone-300 line-through" : "border-stone-200 text-stone-700"}`}
                >
                  {time}
                </span>
              ),
            )}
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-stone-100 p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-amber-800">
              <SparkleIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-stone-500">خدمت انتخاب‌شده</p>
              <p className="truncate text-sm font-black">کوتاهی و استایل مو</p>
            </div>
            <span className="text-sm font-black">۴۵ دقیقه</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -start-5 flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-xl sm:-start-10">
        <span className="grid size-9 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckIcon />
        </span>
        <div>
          <p className="text-xs text-stone-500">رزرو آنلاین</p>
          <p className="text-sm font-black">سریع و مطمئن</p>
        </div>
      </div>
    </div>
  );
}


