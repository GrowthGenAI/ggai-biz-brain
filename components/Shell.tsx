'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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
          <img src="/ggai-mark.svg" alt="" />
          <div>
            <b>Business Brain</b>
            <small>by Growth GenAI</small>
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
          GGAI Business Brain v1
          <br />
          <button onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
