'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/cleaner/jobs', label: 'Jobs' },
  { href: '/cleaner/training', label: 'Training' },
];

export default function CleanerPortalNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-2 border-b border-gray-200 pb-3">
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
