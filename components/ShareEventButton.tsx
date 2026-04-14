'use client';

import { useEffect, useMemo, useState } from 'react';

export default function ShareEventButton({ title }: { title: string }) {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const shareData = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return {
      title,
      url: window.location.href,
    };
  }, [title]);

  if (!canShare) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        if (!shareData) return;
        try {
          await navigator.share(shareData);
        } catch {
          // user cancelled share or browser blocked
        }
      }}
      className="w-full text-center border py-3 rounded-xl text-sm hover:bg-gray-50"
    >
      Share Event
    </button>
  );
}

