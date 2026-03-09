'use client';
import { useEffect, useRef } from 'react';
import Home from '@/app/page';

export default function FeedWithHighlight({ slug }: { slug: string }) {
  return <Home highlightSlug={slug} />;
}
