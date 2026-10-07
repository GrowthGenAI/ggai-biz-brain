'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { APP_BYLINE, APP_LOGO, APP_NAME } from '@/lib/appbrand';

const NAV = [
  { href: '/', label: '✦ Studio' },
  { href: '/brain', label: '◎ Brain' },
  { href: '/brand', label: '◆ Brand Kit' },
  { href: '/history', label: '☰ History' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const on = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand-row">
          <img src={APP_LOGO} alt="" style={{ objectFit: 'contain' }} />
          <div>
            <b>{APP_NAME}</b>
            <small>{APP_BYLINE}</small>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={on(n.href) ? 'on' : ''}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="spacer" />
        <div className="foot">
          {APP_NAME} v1
          <br />
          <button onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
