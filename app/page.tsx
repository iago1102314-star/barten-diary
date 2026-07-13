import { redirect } from "next/navigation";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildDiariesRedirectPath(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
      continue;
    }
    query.set(key, value);
  }

  const serialized = query.toString();
  return serialized ? `/diaries?${serialized}` : "/diaries";
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  redirect(buildDiariesRedirectPath(params));
}
