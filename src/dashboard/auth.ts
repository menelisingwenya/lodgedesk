// PLACEHOLDER, replace with Supabase Auth.
//
// Demo-only staff sign-in. Any non-empty email and password are accepted while
// the app runs in development (`import.meta.env.DEV`). In a production build
// the guard below rejects every attempt, so this placeholder can never
// authenticate a real user. Passwords are never stored, persisted or logged.

export interface StaffUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  initials: string;
}

const DEMO_USER: Omit<StaffUser, "email"> = {
  id: "demo-staff",
  displayName: "Demo Staff",
  role: "Front desk",
  initials: "DS",
};

const listeners = new Set<(user: StaffUser | null) => void>();
let currentUser: StaffUser | null = null;

function emit() {
  for (const listener of listeners) listener(currentUser);
}

export async function signIn(email: string, password: string): Promise<StaffUser> {
  if (!import.meta.env.DEV) {
    throw new Error("Incorrect email or password.");
  }

  // Keep the loading state visible long enough to be perceptible.
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!email.trim() || !password.trim()) {
    throw new Error("Incorrect email or password.");
  }

  currentUser = { ...DEMO_USER, email: email.trim() };
  emit();
  return currentUser;
}

export function signOut(): void {
  currentUser = null;
  emit();
}

export function getCurrentUser(): StaffUser | null {
  if (!import.meta.env.DEV) return null;
  return currentUser;
}

export function onAuthChange(callback: (user: StaffUser | null) => void): () => void {
  listeners.add(callback);
  callback(getCurrentUser());
  return () => {
    listeners.delete(callback);
  };
}
