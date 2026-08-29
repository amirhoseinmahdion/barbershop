import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/helper/authshell";

export default function LoginPage() {
  return (
    <AuthShell
      title="خوش آمدید"
      description="برای مدیریت پروفایل و رزروهای خود وارد شوید."
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
