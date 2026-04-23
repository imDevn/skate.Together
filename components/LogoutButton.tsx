"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button className="pill" onClick={handleLogout}>
      Logout
    </button>
  );
}