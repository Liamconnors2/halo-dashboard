import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import MobileNav from './MobileNav';

export const metadata = {
  title: 'Halo Dashboard',
  description: 'Daily content planning for Halo',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Halo'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#013b4a'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#fffff4] text-[#010101] min-h-screen">
        {/* Desktop header */}
        <header className="border-b border-black/10 sticky top-0 bg-[#fffff4]/95 backdrop-blur z-50 hidden md:block">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-medium tracking-tight text-lg text-[#013b4a]">Halo</span>
              <Image src="/logo.png" alt="Halo" width={32} height={32} className="object-contain" />
            </Link>
            <nav className="flex gap-1 text-sm">
              <Link href="/" className="px-3 py-1.5 rounded-md hover:bg-black/5">Week</Link>
              <Link href="/ideas" className="px-3 py-1.5 rounded-md hover:bg-black/5">Ideas</Link>
              <Link href="/media" className="px-3 py-1.5 rounded-md hover:bg-black/5">Media</Link>
              <Link href="/hooks" className="px-3 py-1.5 rounded-md hover:bg-black/5">Hooks</Link>
              <Link href="/performance" className="px-3 py-1.5 rounded-md hover:bg-black/5">Performance</Link>
              <Link href="/settings" className="px-3 py-1.5 rounded-md hover:bg-black/5">Settings</Link>
            </nav>
          </div>
        </header>

        {/* Mobile header */}
        <header className="border-b border-black/10 sticky top-0 bg-[#fffff4]/95 backdrop-blur z-50 md:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Halo" width={28} height={28} className="object-contain" />
              <span className="font-medium tracking-tight text-base text-[#013b4a]">Halo</span>
            </Link>
            <Link href="/settings" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-black/50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </Link>
          </div>
        </header>

        {/* Main content — extra bottom padding on mobile for the tab bar */}
        <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-6">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <MobileNav />

        {/* Register service worker */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        `}} />
      </body>
    </html>
  );
}
