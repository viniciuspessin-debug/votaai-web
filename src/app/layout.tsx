import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VotaAí — Qual é a sua?',
  description: 'Enquetes rápidas e viciantes. Vote, veja os resultados e compare com o Brasil.',
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
