import type { Metadata } from 'next';
import { Orbitron, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AudioControllerShell } from '@/components/audio/AudioController';
import { ClientShell } from '@/components/ClientShell';

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-orbitron-loaded',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  icons: { icon: '/images/favicon.svg', shortcut: '/images/favicon.svg' },
  title: 'Gabriel Navarro — Data Science · Computer Engineering',
  description:
    'Portfolio of Gabriel Navarro Cerón — building systems at the intersection of intelligence and infrastructure. ITAM, Mexico City.',
  metadataBase: new URL('https://gabonavarro.github.io'),
  openGraph: {
    title: 'Gabriel Navarro — Portfolio',
    description: 'JARVIS-inspired interactive portfolio. Data Science · Computer Engineering · ITAM.',
    images: ['/images/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${jetbrainsMono.variable}`}
      style={{ colorScheme: 'dark' }}
    >
      <body>
        <AudioControllerShell>
          <ClientShell />
          {children}
        </AudioControllerShell>
      </body>
    </html>
  );
}
