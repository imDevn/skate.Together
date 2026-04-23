import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ProfileSetupForm from "@/components/ProfileSetupForm";

export default async function ProfileSetupPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, ea_id")
    .eq("id", user.id)
    .maybeSingle();

  const isFirstSetup = !profile || !profile.nickname || !profile.ea_id;

  return (
    <div className="wrap">
      <section className="card section" style={{ maxWidth: 720, minWidth: 400, margin: "0 auto" }}>
        <div className="section-head">
          <div>
            <h2>{isFirstSetup ? "Set Up Profile" : "Edit Profile"}</h2>
            {isFirstSetup && (
              <div className="muted">
                Please choose a nickname and set your EA ID below.
              </div>
            )}
          </div>
        </div>

        <ProfileSetupForm
          userId={user.id}
          initialNickname={profile?.nickname ?? ""}
          initialEaId={profile?.ea_id ?? ""}
        />
      </section>
    </div>
  );
}