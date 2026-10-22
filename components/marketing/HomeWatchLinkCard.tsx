import Link from "next/link";

export function HomeWatchLinkCard() {
  return (
    <Link
      href="/vermont/home-watch"
      className="flex items-center justify-between gap-4 rounded-xl border border-vm-border bg-white px-5 py-5 font-heading text-base font-semibold text-vm-navy shadow-sm transition hover:border-vm-cyan"
    >
      Away for the winter? Home Watch →
    </Link>
  );
}
