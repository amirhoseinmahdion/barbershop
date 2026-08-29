import type { UserRole } from "@/lib/auth";

export interface AuthFormProps {
  mode: "login" | "register";
}


export interface ProtectedPageProps {
  allowedRole: UserRole;
  eyebrow: string;
  title: string;
  description: string;
  manageSalon?: boolean;
  managePlatform?: boolean;
}

export interface PersianDatePickerProps {
  value: string;
  onChange: (gregorianDate: string) => void;
  disabled?: boolean;
}


export interface AdminBooking {
  id: string;
  startsAt: string;
  endsAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  serviceName: string;
  durationMinutes: number;
  customer: { firstName: string; lastName: string; phone: string };
}

export interface WeeklyPeriod {
  id?: string;
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
}
