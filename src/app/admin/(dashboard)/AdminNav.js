'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/questions', label: 'Questions' },
  { href: '/admin/availability', label: 'Availability' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside className="a-sidebar">
      <div className="a-brand">
        <span className="dot"></span>
        <div>
          <div className="text">4REEL.STUDIO</div>
          <div className="sub mono">ADMIN</div>
        </div>
      </div>

      <nav className="a-nav">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} className={active ? 'active' : ''}>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="a-sidebar-foot">
        <Link href="/" className="a-viewsite" target="_blank" rel="noopener">View site ↗</Link>
        <button type="button" className="a-btn ghost sm" onClick={handleLogout}>Log out</button>
      </div>
    </aside>
  );
}
