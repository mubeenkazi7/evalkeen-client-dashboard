"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Overview", match: (p: string) => p === "/" || p.startsWith("/services") },
  { href: "/leads", label: "Leads", match: (p: string) => p.startsWith("/leads") },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Main">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} className={i.match(path) ? "on" : undefined} aria-current={i.match(path) ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
