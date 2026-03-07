import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    signOut: "/logout",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");

      if (isOnAdmin) {
        if (isLoggedIn) {
          return true;
        }

        return false;
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/admin", nextUrl));
      }
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
