'use client';

import { useEffect, useState } from 'react';
import EventCard from './EventCard';
import EventCardSkeleton from './EventCardSkeleton';

export default function EventsList({
  initialEvents,
  query,
  category,
  locality,
}: any) {
  const [events, setEvents] = useState(initialEvents || []);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      page: String(page + 1),
      q: query || '',
      category: category || '',
      locality: locality || '',
    });

    const res = await fetch(`/api/events?${params.toString()}`);
    const data = await res.json();

    setEvents((prev: any) => [...prev, ...data.events]);
    setPage((p) => p + 1);
    setLoading(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        if (!loading) loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading]);

  return (
    <div>

      {/* EVENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {events.map((e: any) => (
          <EventCard key={e.id} event={e} />
        ))}

        {/* 🔥 SKELETONS WHILE LOADING */}
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
      </div>

      {/* OPTIONAL TEXT */}
      {loading && (
        <p className="text-center text-sm text-gray-400 mt-4">
          Loading more events...
        </p>
      )}

    </div>
  );
}
