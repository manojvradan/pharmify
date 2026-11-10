import { Suspense } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { StreakCard, StreakCardFallback } from "@/components/StreakCard";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-wrap items-stretch bg-canvas text-base leading-normal">
      <AppSidebar
        streak={
          <Suspense fallback={<StreakCardFallback />}>
            <StreakCard />
          </Suspense>
        }
      />
      {children}
    </div>
  );
}
