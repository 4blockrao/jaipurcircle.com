type Locality = { name?: string; slug?: string };
type Category = { name?: string; slug?: string };

function safe(val?: string) {
  return val || '';
}

export function getLocalitySEO(locality: Locality) {
  const name = safe(locality?.name);

  return {
    intro: `Looking for things to do in ${name}, Jaipur? This area is one of the most active parts of the city, with a mix of events, nightlife, workshops, and social experiences happening regularly.`,
    highlights: [
      `${name} hosts a variety of events including live shows, workshops, and nightlife experiences.`,
      `It attracts both local residents and visitors exploring Jaipur.`,
      `Events here range from casual gatherings to curated experiences across different interests.`,
    ],
    outro: `Whether you’re planning your weekend or exploring something new, ${name} offers a dynamic mix of events and experiences in Jaipur.`,
  };
}

export function getCategorySEO(category: Category) {
  const name = safe(category?.name);

  return {
    intro: `${name} events in Jaipur continue to attract audiences looking for curated experiences, entertainment, and social engagement.`,
    highlights: [
      `${name} events include a mix of upcoming shows, live performances, and curated experiences.`,
      `These events are hosted across popular venues in Jaipur.`,
      `They cater to a wide range of audiences, from casual attendees to enthusiasts.`,
    ],
    outro: `Explore the latest ${name.toLowerCase()} in Jaipur and discover events that match your interests.`,
  };
}

export function getHybridSEO(category: Category, locality: Locality) {
  const cat = safe(category?.name);
  const loc = safe(locality?.name);

  return {
    intro: `Looking for ${cat.toLowerCase()} in ${loc}, Jaipur? This page helps you discover the most relevant events happening in this area.`,
    highlights: [
      `${loc} regularly hosts ${cat.toLowerCase()} events across multiple venues.`,
      `These events include both upcoming and past experiences, helping users understand the local scene.`,
      `You can explore related events across Jaipur or within this locality.`,
    ],
    outro: `Stay updated with the latest ${cat.toLowerCase()} in ${loc} and explore more events across Jaipur.`,
  };
}
