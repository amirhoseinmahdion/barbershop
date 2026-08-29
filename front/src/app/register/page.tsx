import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/helper/authshell";

export default function RegisterPage() {
  return (
    <AuthShell
      title="حساب کاربری خود را بسازید"
      description="ثبت‌نام کنید، سالن موردنظر را پیدا کنید و آنلاین نوبت بگیرید."
    >
      <AuthForm mode="register" />
    </AuthShell>
  );
}
