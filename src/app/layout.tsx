import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VotaAí — Qual é a sua?',
  description: 'Enquetes rápidas e viciantes. Vote, veja os resultados e compare com o Brasil.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '128x128' }],
  },
  openGraph: {
    title: 'VotaAí',
    description: 'Qual é a sua? Vote agora.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="grain" />
        {children}
      </body>
    </html>
  );
}
