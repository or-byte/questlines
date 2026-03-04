import { createAuthClient } from "better-auth/solid";

const authClient = createAuthClient({
  baseURL: import.meta.env.ORIGIN,
});

export const signInWithGoogle = () =>
  authClient.signIn.social({ provider: "google" });

export const signOut = authClient.signOut;
export const useSession = authClient.useSession;
