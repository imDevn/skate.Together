"use client";

import ProfileSetupForm from "@/components/ProfileSetupForm";

type ProfileSetupModalProps = {
  userId: string;
  initialNickname: string;
  initialEaId: string;
};

export default function ProfileSetupModal({
  userId,
  initialNickname,
  initialEaId,
}: ProfileSetupModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="card section modal-card">
        <h2>Set Up Profile</h2>
        <p className="muted">
          Add your nickname and EA ID before creating or joining sessions.
        </p>

        <ProfileSetupForm
          userId={userId}
          initialNickname={initialNickname}
          initialEaId={initialEaId}
          redirectAfterSave="/"
        />
      </div>
    </div>
  );
}
