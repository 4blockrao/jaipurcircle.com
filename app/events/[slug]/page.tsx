import { notFound } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE || "";

function extractLastTitle(html: string): string | null {
  const matches = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  if (!matches.length) return null;
  return matches[matches.length - 1][1].trim();
}

function extractMetaDescription(html: string): string | null {
  const match = html.match(
    /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i
  );
  return match ? match[1].trim() : null;
}

function extractSsrBlock(html: string): string | null {
  const match = html.match(
    /<div class="ssr-prerender"[\s\S]*?<\/div>/i
  );
  return match ? match[0] : null;
}

async function getEventHtml(slug: string) {
  if (!API) {
    console.error("NEXT_PUBLIC_API_BASE is missing");
    return null;
  }

  try {
    const res = await fetch(`${API}/event-ssr?slug=${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("event-ssr failed", res.status, slug);
      return null;
    }

    const html = await res.text();

    if (
      html.includes("Event not found") ||
      html.includes("We couldn’t find an event for slug")
    ) {
      return null;
    }

    return html;
  } catch (err) {
    console.error("event-ssr fetch crashed", slug, err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolved = await Promise.resolve(params);
  const slug = resolved?.slug;

  if (!slug) {
    return {
      title: "Event not found | JaipurCircle",
    };
  }

  const html = await getEventHtml(slug);

  if (!html) {
    return {
      title: "Event not found | JaipurCircle",
    };
  }

  const title = extractLastTitle(html) || "Event Details | JaipurCircle";
  const description =
    extractMetaDescription(html) ||
    "Check event details, venue, timings and booking info on JaipurCircle.";

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.jaipurcircle.com/events/${slug}`,
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolved = await Promise.resolve(params);
  const slug = resolved?.slug;

  if (!slug) return notFound();

  const html = await getEventHtml(slug);

  if (!html) return notFound();

  const ssrBlock = extractSsrBlock(html);

  if (!ssrBlock) {
    console.error("Could not extract ssr-prerender block for", slug);
    return notFound();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div dangerouslySetInnerHTML={{ __html: ssrBlock }} />
    </main>
  );
}
