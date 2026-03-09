'use client';
import Home, { HomeProps } from '@/app/page';

export default function FeedWithHighlight({ slug }: { slug: string }) {
  const props: HomeProps = { highlightSlug: slug };
  return <Home {...props} />;
}
