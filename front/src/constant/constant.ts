import { CalendarIcon, SearchIcon, SparkleIcon } from "@/components/helper/icon";

export const audiences = [
  { label: "سالن‌های زنانه", value: "WOMEN", icon: "✦" },
  { label: "سالن‌های مردانه", value: "MEN", icon: "◆" },
  { label: "سالن‌های مشترک", value: "UNISEX", icon: "●" },
];



export const benefits = [
  { title: "انتخاب آگاهانه", description: "خدمات، قیمت و اطلاعات سالن‌ها را یک‌جا مقایسه کنید.", icon: SearchIcon },
  { title: "زمان‌های واقعی و آزاد", description: "زمان‌های قابل رزرو را ببینید و بهترین ساعت را انتخاب کنید.", icon: CalendarIcon },
  { title: "رزرو ساده و سریع", description: "بدون تماس تلفنی، نوبت خود را در چند مرحله ثبت کنید.", icon: SparkleIcon },
];


export const iranianWeekDays = [
  { dayOfWeek: 6, label: "شنبه" },
  { dayOfWeek: 0, label: "یکشنبه" },
  { dayOfWeek: 1, label: "دوشنبه" },
  { dayOfWeek: 2, label: "سه‌شنبه" },
  { dayOfWeek: 3, label: "چهارشنبه" },
  { dayOfWeek: 4, label: "پنجشنبه" },
  { dayOfWeek: 5, label: "جمعه" },
] as const;
