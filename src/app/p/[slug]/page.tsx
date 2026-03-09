import { Metadata } from 'next';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import FeedWithHighlight from '@/components/FeedWithHighlight';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAts2gnUCTGn6JNYm3p6bSloKIbqp6vhsI",
  authDomain: "votaai-9b91d.firebaseapp.com",
  projectId: "votaai-9b91d",
  storageBucket: "votaai-9b91d.firebasestorage.app",
  messagingSenderId: "397158117789",
  appId: "1:397158117689:web:9caba03f7a21e97721f8e8",
};

async function getPollBySlug(slug: string) {
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig, 'server');
    const db = getFirestore(app);
    const q = query(collection(db, 'polls'), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const poll = await getPollBySlug(params.slug);

  if (!poll) {
    return {
      title: 'VotaAí — Qual é a sua?',
      description: 'Enquetes rápidas e viciantes. Vote agora!',
    };
  }

  const total = (poll.votesA || 0) + (poll.votesB || 0);
  const pctA = total > 0 ? Math.round((poll.votesA / total) * 100) : 50;
  const pctB = 100 - pctA;
  const description = `${poll.optionA?.emoji} ${poll.optionA?.label} ${pctA}% vs ${poll.optionB?.emoji} ${poll.optionB?.label} ${pctB}% — Vote você também!`;

  return {
    title: `${poll.question} — VotaAí`,
    description,
    openGraph: {
      title: poll.question,
      description,
      type: 'website',
      url: `https://votaai.app/p/${params.slug}`,
      siteName: 'VotaAí',
    },
    twitter: {
      card: 'summary',
      title: poll.question,
      description,
    },
  };
}

export default function PollPage({ params }: { params: { slug: string } }) {
  return <FeedWithHighlight slug={params.slug} />;
}
