import { createAuthClient } from "better-auth/react";
import { genericOAuthClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3005",
  plugins: [genericOAuthClient()],
});

export const {
  signIn,
  signOut,
  useSession,
} = authClient;
