import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import EventCard from '@/components/EventCard';

import {
  buildEventParentLinks,
  buildCrossEntityLinks,
  buildEventBreadcrumbs,
} from '@/lib/internal-linking';

export default async function EventPage({ params }: any) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params;

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!event) return notFound();

  const category = event.category
    ? { slug: event.category, name: event.category }
    : null;

  const locality = event.locality
    ? { slug: event.locality, name: event.locality }
    : null;

  const venue = event.venue_name
    ? { slug: event.venue_name.toLowerCase().replace(/\s+/g, '-'), name: event.venue_name }
    : null;

  const breadcrumbs = buildEventBreadcrumbs({
    eventTitle: event.title,
    category,
    locality,
  });

  const parentLinks = buildEventParentLinks({
    category,
    locality,
    venue,
  });

  const crossLinks = buildCrossEntityLinks({
    category,
    locality,
    venue,
  });

  const { data: related } = await supabase
    .from('events')
    .select('*')
    .eq('editorial_status', 'published')
    .neq('id', event.id)
    .limit(6);

  const safeRelated = Array.isArray(related) ? related : [];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 pb-20">

      {/* Breadcrumb */}
      <nav className="mt-6 text-sm text-gray-500 flex flex-wrap gap-2">
        {breadcrumbs.map((b, i) => (
          <span key={i}>
            {b.href !== '#' ? (
              <a href={b.href} className="hover:text-black">{b.label}</a>
            ) : (
              <span className="text-black">{b.label}</span>
            )}
            {i < breadcrumbs.length - 1 && ' > '}
          </span>
        ))}
      </nav>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold mt-4">
        {event.title}
      </h1>

      {/* Parent Links */}
      <div className="mt-4 flex flex-wrap gap-2">
        {parentLinks.map((l, i) => (
          <a key={i} href={l.href} className="px-3 py-1 rounded-full bg-gray-100 text-sm">
            {l.label}
          </a>
        ))}
      </div>

      {/* Cross Links */}
      <div className="mt-3 flex flex-wrap gap-2">
        {crossLinks.map((l, i) => (
          <a key={i} href={l.href} className="px-3 py-1 rounded-full bg-gray-50 text-xs">
            {l.label}
          </a>
        ))}
      </div>

      {/* Description */}
      <p className="mt-6 text-gray-600">
        {event.description || event.short_description}
      </p>

      {/* Related */}
      {safeRelated.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Related Events</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeRelated.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
