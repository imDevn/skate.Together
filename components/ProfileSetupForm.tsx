"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type ProfileSetupFormProps = {
  userId: string;
  initialNickname: string;
  initialEaId: string;
};

export default function ProfileSetupForm({
  userId,
  initialNickname,
  initialEaId,
}: ProfileSetupFormProps) {
  const router = useRouter();

  const [nickname, setNickname] = useState(initialNickname);
  const [eaId, setEaId] = useState(initialEaId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();

    const trimmedNickname = nickname.trim();
    const trimmedEaId = eaId.trim();

    if (!trimmedNickname || !trimmedEaId) {
      setMessage("Nickname and EA ID are both required.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        nickname: trimmedNickname,
        ea_id: trimmedEaId,
      },
      {
        onConflict: "id",
      }
    );

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Profile saved.");
    setSaving(false);
    router.push("/");
    router.refresh();
  };

  return (
    <form className="quick-form" onSubmit={handleSubmit}>
      <div>
        <div className="label-row">
          <label htmlFor="nickname">
            <strong>Nickname</strong>
          </label>
        </div>
        <input
          id="nickname"
          className="input"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="How your name should appear on the site"
          maxLength={24}
        />
      </div>

      <div>
        <div className="label-row">
          <label htmlFor="eaId">
            <strong>EA ID</strong>
          </label>
        </div>
        <input
          id="eaId"
          className="input"
          value={eaId}
          onChange={(e) => setEaId(e.target.value)}
          placeholder="Your in-game EA ID"
          maxLength={32}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? "Saving..." : "Save Profile"}
      </button>

      {message ? <p className="muted">{message}</p> : null}
    </form>
  );
}