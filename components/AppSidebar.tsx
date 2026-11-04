"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CardsIcon, DocIcon, Flame, HomeIcon, LogoMark, PersonIcon } from "@/components/icons";

const items = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/flashcards", label: "Flashcards", Icon: CardsIcon, badge: "12" },
  { href: "/debrief", label: "Debriefs", Icon: DocIcon },
  { href: "#profile", label: "Profile", Icon: PersonIcon },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="App"
      className="box-border flex flex-[1_1_240px] flex-col gap-7 border-r border-line-soft bg-white px-[18px] py-6"
    >
      <Link href="/" className="flex items-center gap-2.5 px-2 text-ink no-underline">
        <LogoMark size={28} />
        <span className="text-[22px] font-bold tracking-[-0.02em]">pharmify</span>
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-1.5 text-base font-bold">
        {items.map(({ href, label, Icon, badge }) => {
          const active = pathname === href;
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

      <div className="mt-auto flex items-center gap-3 rounded-[18px] bg-sun-tint p-4">
        <Flame size={48} className="flex-none" />
        <div className="flex flex-col leading-[1.3]">
          <span className="text-lg font-bold">3-day streak</span>
          <span className="text-[13px] text-muted">Play today to keep it</span>
        </div>
      </div>
    </aside>
  );
}
