"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../Toasts";
import { APP_NAME } from "@/lib/brand";
import { HomeIcon, MoreIcon, ProfileIcon, QuestIcon, ShieldIcon, ShopIcon } from "../icons";

export const NAV_ITEMS = [
  { href: "/learn", label: "Learn", Icon: HomeIcon },
  { href: "/leaderboard", label: "Leaderboards", Icon: ShieldIcon },
  { href: "/quests", label: "Quests", Icon: QuestIcon },
  { href: "/shop", label: "Shop", Icon: ShopIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
  { href: "/settings", label: "More", Icon: MoreIcon },
];

export function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Left navigation (tablet: icons only, desktop: icons + labels). */
export function Sidebar() {
  const isActive = useIsActive();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[88px] flex-col border-r-2 border-line px-3 py-6 md:flex xl:w-64 xl:px-4">
      <Link href="/learn" className="mb-6 px-2 xl:px-4">
        <span className="hidden text-[32px] font-black lowercase tracking-tight text-green xl:block">{APP_NAME}</span>
        <span className="block text-center text-[32px] font-black text-green xl:hidden">{APP_NAME[0]}</span>
      </Link>
      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.filter((item) => item.href !== "/settings").map(({ href, label, Icon }) => (
          <Link key={href} href={href} title={label} className={navClass(isActive(href))}>
            <Icon size={32} />
            <span className="hidden xl:inline">{label}</span>
          </Link>
        ))}
        <MoreMenu active={isActive("/settings")} />
      </nav>
    </aside>
  );
}

const navClass = (active: boolean) =>
  `flex h-[52px] w-full items-center justify-center gap-5 rounded-xl border-2 px-2 text-[15px] font-extrabold uppercase tracking-wider transition-colors xl:justify-start xl:px-4 ${
    active ? "border-blue-border bg-blue-light text-blue" : "border-transparent text-[color:var(--nav-text)] hover:bg-bg-soft"
  }`;

/** "More" opens a menu (hover or click), like the original, instead of navigating. */
function MoreMenu({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const item = "block w-full px-6 py-3 text-left text-[15px] font-extrabold uppercase tracking-wide text-ink-strong hover:bg-bg-soft";
  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className={navClass(active || open)} onClick={() => setOpen((o) => !o)} aria-expanded={open} title="More">
        <MoreIcon size={32} />
        <span className="hidden xl:inline">More</span>
      </button>
      {open && (
        // pl-2 bridges the gap so the menu doesn't close while the pointer moves onto it
        <div className="absolute left-full top-0 z-40 pl-2">
          <div className="w-64 animate-pop overflow-hidden rounded-2xl border-2 border-line bg-bg py-2 shadow-xl">
            <Link href="/settings" className={item} onClick={() => setOpen(false)}>Settings</Link>
            <Link href="/help" className={item} onClick={() => setOpen(false)}>Help</Link>
            <button className={item} onClick={() => toast({ title: "You're the demo learner", body: "Sign-in and accounts are coming soon.", tone: "info" })}>Log out</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Bottom tab bar on phones. */
export function MobileTabBar() {
  const isActive = useIsActive();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t-2 border-line bg-bg md:hidden">
      {NAV_ITEMS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 ${
            isActive(href) ? "border-blue-border bg-blue-light" : "border-transparent"
          }`}
        >
          <Icon size={30} />
        </Link>
      ))}
    </nav>
  );
}
