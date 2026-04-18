import { redirect } from 'next/navigation';

export default async function EventsInLocalityPage({
  params,
}: {
  params: Promise<{ locality: string }>;
}) {
  const { locality } = await params;
  redirect(`/events?locality=${encodeURIComponent(locality)}`);
}
