"use client";

import { useState } from "react";


export default function LogoutButton() {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="button button-secondary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
          });
        } finally {
          window.location.href = "/login";
        }
      }}
    >
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}
