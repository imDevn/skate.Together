import { createClient } from "@/utils/supabase/server";
import HomePageClient from "@/components/HomePageClient";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { nickname: string | null; ea_id: string | null } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("nickname, ea_id")
      .eq("id", user.id)
      .maybeSingle();

    profile = data;
  }

  return <HomePageClient user={user} profile={profile} />;
}
