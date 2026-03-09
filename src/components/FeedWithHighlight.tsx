'use client';

// This component renders the main feed and scrolls to the target poll
import { useEffect } from 'react';
import Home from '@/app/page';

// Store slug in sessionStorage so Home can read it
export default function FeedWithHighlight({ slug }: { slug: string }) {
  useEffect(() => {
    if (slug) sessionStorage.setItem('highlightSlug', slug);
  }, [slug]);
  return <Home />;
}
