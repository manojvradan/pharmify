import { AuthShell } from "@/components/AuthShell";

/** Shared by /sign-in and /sign-up, so the brand panel and tab switch stay mounted between them. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
