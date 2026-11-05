"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { SESSION_SIZE } from "@/lib/flashcards";
import { CardsIcon, DocIcon, Flame, HomeIcon, LogoMark } from "@/components/icons";

const items = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/flashcards", label: "Flashcards", Icon: CardsIcon, badge: String(SESSION_SIZE) },
  { href: "/debrief", label: "Debriefs", Icon: DocIcon },
];

/** The main nav. `pathname` is null while the route is still prerendering: no item is highlighted yet. */
function Nav({ pathname }: { pathname: string | null }) {
  return (
      <nav aria-label="Main" className="flex flex-col gap-1.5 text-base font-bold">
        {items.map(({ href, label, Icon, badge }) => {
          const active = pathname !== null && (pathname === href || (href !== "/home" && pathname.startsWith(`${href}/`)));
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-[14px] px-4 no-underline ${
                active ? "bg-pink-tint text-pink-deep hover:text-pink-deep" : "text-ink-2 hover:text-ink"
              }`}
            >
              <Icon color={active ? "#16112A" : "#403A50"} />
              {label}
              {badge && (
                <span
                  className={`ml-auto rounded-full px-[9px] py-px text-[13px] text-ink ${
                    active ? "border-[1.5px] border-ink bg-white" : "bg-sun"
                  }`}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
  );
}

/** Reads the URL, so it must sit inside <Suspense> on dynamic routes (Cache Components). */
function ActiveNav() {
  return <Nav pathname={usePathname()} />;
}

/** Avatar (opens Clerk's account menu) with the user's name and email beside it. */
function Profile() {
  const { user } = useUser();
  const name = user?.fullName || user?.firstName || "Your account";
  const email = user?.primaryEmailAddress?.emailAddress;
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-[14px] px-2">
      <UserButton appearance={{ elements: { avatarBox: "size-9" } }} />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[15px] font-bold text-ink">{name}</span>
        {email && <span className="truncate text-[13px] text-subtle">{email}</span>}
      </div>
    </div>
  );
}

/**
 * Side by side with the page (wide screens), it stays put while the page scrolls, with
 * the streak and profile pinned to the bottom. When it wraps above the page on narrow
 * screens it scrolls away normally.
 */
export function AppSidebar() {
  return (
    <aside
      aria-label="App"
      className="box-border flex flex-[1_1_240px] flex-col gap-7 border-r border-line-soft bg-white px-[18px] py-6 min-[820px]:sticky min-[820px]:top-0 min-[820px]:h-screen min-[820px]:self-start min-[820px]:overflow-y-auto"
    >
      <Link href="/" className="flex items-center gap-2.5 px-2 text-ink no-underline">
        <LogoMark size={38} />
        <span className="text-[22px] font-bold tracking-[-0.02em] text-brand">Pharmify</span>
      </Link>

      <Suspense fallback={<Nav pathname={null} />}>
        <ActiveNav />
      </Suspense>

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-[18px] bg-sun-tint p-4">
          <Flame size={48} className="flex-none" />
          <div className="flex flex-col leading-[1.3]">
            <span className="text-lg font-bold">3-day streak</span>
            <span className="text-[13px] text-muted">Play today to keep it</span>
          </div>
        </div>
        <div className="border-t border-line-soft pt-3">
          <Profile />
        </div>
      </div>
    </aside>
  );
}
