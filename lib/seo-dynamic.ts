type Event = {
  start_time?: string;
  start_date?: string;
  category_name?: string;
  venue_name?: string;
};

function getDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function isUpcoming(event: Event) {
  const d = getDate(event.start_time || event.start_date);
  if (!d) return false;
  return d >= new Date();
}

function isThisWeek(event: Event) {
  const d = getDate(event.start_time || event.start_date);
  if (!d) return false;

  const now = new Date();
  const weekLater = new Date();
  weekLater.setDate(now.getDate() + 7);

  return d >= now && d <= weekLater;
}

/* =========================
   LOCALITY DYNAMIC SEO
   ========================= */

export function buildLocalityDynamicSEO(locality: any, events: Event[]) {
  const name = locality?.name || 'this area';

  const upcoming = events.filter(isUpcoming);
  const thisWeek = events.filter(isThisWeek);

  const total = upcoming.length;
  const weekCount = thisWeek.length;

  return {
    intro: `${name} currently has ${total} upcoming events, with ${weekCount} happening this week.`,

    insights: [
      `${total} events are actively listed in ${name}, making it one of the active local areas in Jaipur.`,
      `${weekCount} events are scheduled in the next 7 days.`,
      `This locality continues to see a steady flow of new experiences and activities.`,
    ],
  };
}

/* =========================
   CATEGORY DYNAMIC SEO
   ========================= */

export function buildCategoryDynamicSEO(category: any, events: Event[]) {
  const name = category?.name || 'events';

  const upcoming = events.filter(isUpcoming);
  const thisWeek = events.filter(isThisWeek);

  return {
    intro: `There are currently ${upcoming.length} upcoming ${name.toLowerCase()} in Jaipur, with ${thisWeek.length} scheduled this week.`,

    insights: [
      `${upcoming.length} active events fall under ${name}.`,
      `${thisWeek.length} events are happening in the next few days.`,
      `${name} continues to grow as a popular event category in Jaipur.`,
    ],
  };
}

/* =========================
   HYBRID DYNAMIC SEO
   ========================= */

export function buildHybridDynamicSEO(category: any, locality: any, events: Event[]) {
  const cat = category?.name || 'events';
  const loc = locality?.name || 'this area';

  const upcoming = events.filter(isUpcoming);
  const thisWeek = events.filter(isThisWeek);

  return {
    intro: `${upcoming.length} ${cat.toLowerCase()} are currently happening in ${loc}, with ${thisWeek.length} scheduled this week.`,

    insights: [
      `${loc} is actively hosting ${cat.toLowerCase()} across multiple venues.`,
      `${thisWeek.length} events are happening in the coming days.`,
      `This combination of ${cat.toLowerCase()} in ${loc} is gaining strong local interest.`,
    ],
  };
}
