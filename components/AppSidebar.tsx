"use client";

import { UserButton, useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SESSION_SIZE } from "@/lib/flashcards";
import { CardsIcon, DocIcon, HomeIcon, LogoMark } from "@/components/icons";

const items = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/flashcards", label: "Flashcards", Icon: CardsIcon, badge: String(SESSION_SIZE) },
  { href: "/debrief", label: "History", Icon: DocIcon },
];

const COLLAPSED_KEY = "pharmify.sidebar.collapsed";
const COLLAPSE_EVENT = "pharmify-sidebar";

/** Whether the sidebar is folded to an icon rail. Remembered per browser; expanded on the server. */
function useCollapsed(): [boolean, () => void] {
  const collapsed = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(COLLAPSE_EVENT, onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(COLLAPSE_EVENT, onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    () => {
      try {
        return localStorage.getItem(COLLAPSED_KEY) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );
  const toggle = () => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  };
  return [collapsed, toggle];
}

/** The main nav. `pathname` is null while the route is still prerendering: no item is highlighted yet. */
function Nav({ pathname }: { pathname: string | null }) {
  return (
      <nav aria-label="Main" className="flex flex-col gap-1 text-[15px] font-bold">
        {items.map(({ href, label, Icon, badge }) => {
          const active = pathname !== null && (pathname === href || (href !== "/home" && pathname.startsWith(`${href}/`)));
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              title={label}
              className={`flex min-h-11 items-center gap-3 rounded-[14px] px-3.5 no-underline group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:px-0 ${
                active ? "bg-pink-tint text-pink-deep hover:text-pink-deep" : "text-ink-2 hover:text-ink"
              }`}
            >
              <Icon color={active ? "#16112A" : "#403A50"} />
              <span className="group-data-[collapsed=true]/sidebar:sr-only">{label}</span>
              {badge && (
                <span
                  className={`ml-auto rounded-full px-[9px] py-px text-[13px] text-ink group-data-[collapsed=true]/sidebar:hidden ${
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
    <div className="flex min-h-14 items-center gap-3 rounded-[14px] px-2 group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:px-0">
      <UserButton appearance={{ elements: { avatarBox: "size-9" } }} />
      <div className="flex min-w-0 flex-col leading-tight group-data-[collapsed=true]/sidebar:hidden">
        <span className="truncate text-[15px] font-bold text-ink">{name}</span>
        {email && <span className="truncate text-[13px] text-subtle">{email}</span>}
      </div>
    </div>
  );
}

/** Signs out and goes back to the landing page. Icon only when the sidebar is collapsed. */
function LogOut() {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => void signOut({ redirectUrl: "/" })}
      title="Log out"
      className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-[12px] border-0 bg-transparent px-3.5 text-[15px] font-bold text-ink-2 hover:bg-chip hover:text-ink group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:px-0"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="flex-none">
        <path d="M8 3.5H5A1.5 1.5 0 003.5 5v10A1.5 1.5 0 005 16.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12.5 6.5L16 10l-3.5 3.5M16 10H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="group-data-[collapsed=true]/sidebar:sr-only">Log out</span>
    </button>
  );
}

/**
 * Side by side with the page (wide screens), it stays put while the page scrolls, with
 * the streak and profile pinned to the bottom, and folds to an icon rail with the button
 * by the logo. When it wraps above the page on narrow screens it scrolls away normally.
 * `streak` is rendered on the server (components/StreakCard.tsx).
 */
export function AppSidebar({ streak }: { streak: ReactNode }) {
  const [collapsed, toggle] = useCollapsed();
  return (
    <aside
      aria-label="App"
      data-collapsed={collapsed}
      className={`group/sidebar box-border flex flex-[1_1_100%] flex-col gap-6 border-r border-line-soft bg-white px-3.5 py-5 transition-[flex-basis] duration-300 ease-out min-[820px]:sticky min-[820px]:top-0 min-[820px]:h-screen min-[820px]:self-start min-[820px]:overflow-x-hidden min-[820px]:overflow-y-auto ${
        collapsed ? "min-[820px]:flex-[0_0_72px] min-[820px]:px-2.5" : "min-[820px]:flex-[0_0_208px]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 group-data-[collapsed=true]/sidebar:flex-col">
        <Link href="/" className="flex items-center gap-2 px-1.5 text-ink no-underline" aria-label="Pharmify home">
          <LogoMark size={34} />
          <span className="text-xl font-bold tracking-[-0.02em] text-brand group-data-[collapsed=true]/sidebar:hidden">Pharmify</span>
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden size-8 flex-none cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink-2 hover:bg-chip min-[820px]:grid"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="2.5" y="3.5" width="15" height="13" rx="3" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 3.5v13" stroke="currentColor" strokeWidth="1.6" />
            <path d={collapsed ? "M11.5 8l2 2-2 2" : "M14 8l-2 2 2 2"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <Suspense fallback={<Nav pathname={null} />}>
        <ActiveNav />
      </Suspense>

      <div className="mt-auto flex flex-col gap-3">
        {streak}
        <div className="flex flex-col gap-1 border-t border-line-soft pt-3">
          <Profile />
          <LogOut />
        </div>
      </div>
    </aside>
  );
}
