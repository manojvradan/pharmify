import { AppSidebar } from "@/components/AppSidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-wrap items-stretch bg-canvas text-base leading-normal">
      <AppSidebar />
      {children}
    </div>
  );
}
