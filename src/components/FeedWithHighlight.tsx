'use client';
import { HomeCore } from '@/app/page';

export default function FeedWithHighlight({ slug }: { slug: string }) {
  return <HomeCore highlightSlug={slug} />;
}
