import type { AuthOptions } from "next-auth";
import { getServerSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}

const issuer = process.env.OIDC_ISSUER ?? "http://localhost:9000/application/o/reservation-mvp/";

export const authOptions: AuthOptions = {
  providers: [
    {
      id: "authentik",
      name: "authentik",
      type: "oauth",
      wellKnown: `${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`,
      authorization: { params: { scope: "openid email profile groups" } },
      clientId: process.env.OIDC_CLIENT_ID ?? "reservation-mvp",
      clientSecret: process.env.OIDC_CLIENT_SECRET ?? "local-dev-client-secret",
      checks: ["pkce", "state"],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username ?? profile.email,
          email: profile.email,
          image: null,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  session: { strategy: "jwt" },
};

export async function getAccessToken() {
  const session = await getServerSession(authOptions);
  return session?.accessToken;
}
