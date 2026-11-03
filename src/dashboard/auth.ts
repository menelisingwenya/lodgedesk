import { supabase } from "../lib/supabase";

export interface StaffUser {
  id: string;
  displayName: string;
  role: string;
  email?: string;
  initials?: string;
}

let currentUser: StaffUser | null = null;

export async function signIn(email: string, password: string): Promise<StaffUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.user) {
    throw new Error("Incorrect email or password.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("staff_profiles")
    .select("display_name, role, is_active")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    currentUser = null;
    await supabase.auth.signOut();
    throw new Error("This account does not have staff access.");
  }

  currentUser = {
    id: data.user.id,
    displayName: profile.display_name,
    role: profile.role,
  };

  return {
    id: currentUser.id,
    displayName: currentUser.displayName,
    role: currentUser.role,
  };
}

export function getCurrentUser(): StaffUser | null {
  if (!currentUser) return null;
  return {
    id: currentUser.id,
    displayName: currentUser.displayName,
    role: currentUser.role,
  };
}

export async function signOut(): Promise<void> {
  currentUser = null;
  await supabase.auth.signOut();
}

export function onAuthChange(callback: (user: StaffUser | null) => void): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(async () => {
      if (!session?.user) {
        currentUser = null;
        callback(null);
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from("staff_profiles")
          .select("display_name, role, is_active")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (profileError || !profile || !profile.is_active) {
          currentUser = null;
          await supabase.auth.signOut();
          callback(null);
          return;
        }

        currentUser = {
          id: session.user.id,
          displayName: profile.display_name,
          role: profile.role,
        };

        callback(getCurrentUser());
      } catch {
        currentUser = null;
        callback(null);
      }
    }, 0);
  });

  return () => {
    subscription.unsubscribe();
  };
}
