"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError("Email or password is incorrect.");
      setBusy(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="login">
      <section className="login-brand">
        <div className="brand" style={{ padding: 0 }}>
          <div className="logo">L</div>
          <div>
            <div className="brand-name">Lead desk</div>
            <div className="brand-sub">WhatsApp enquiries</div>
          </div>
        </div>
        <div>
          <h2>Every WhatsApp enquiry, answered and tracked.</h2>
          <p>See who&apos;s hot, who&apos;s waiting for a call, and what your leads are asking for, in one place.</p>
        </div>
        <div className="powered" style={{ padding: 0 }}>
          Powered by <b>evalkeen</b>
        </div>
      </section>
      <section className="login-form-side">
        <form className="login-form" onSubmit={onSubmit}>
          <div>
            <h1 style={{ fontSize: 28 }}>Log in</h1>
            <p className="sub">Welcome back. Log in to see your leads.</p>
          </div>
          <label className="field">
            Email
            <input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            Password
            <input type="password" required autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error ? <p className="error" role="alert">{error}</p> : null}
          <button className="primary" type="submit" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
          <p className="note">Only team members your admin has added can log in. Forgot your password? Ask your admin to reset it.</p>
        </form>
      </section>
    </div>
  );
}
