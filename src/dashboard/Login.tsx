import { useState, type FormEvent } from "react";
import { signIn } from "./auth";

const FALLBACK_ERROR = "Incorrect email or password.";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      // Dashboard's onAuthChange listener swaps this screen for the console.
    } catch (err) {
      setError(err instanceof Error ? err.message : FALLBACK_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-mark">
            <img src="/brand/harris-mark.png" alt="" />
          </span>
          <span>
            <strong>LodgeDesk</strong>
            <small>Harris Lodges</small>
          </span>
        </div>

        <h1>Staff sign in</h1>
        <p className="login-sub">Sign in to see guest enquiries.</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="login-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </label>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="login-note">Staff only. Ask the owner if you need access.</p>
      </div>
    </main>
  );
}
