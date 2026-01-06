import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user role to session
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, professorId: true },
      });

      if (dbUser) {
        session.user.role = dbUser.role;
        session.user.professorId = dbUser.professorId;
      }

      return session;
    },
    async signIn({ user, account, profile }) {
      // Only allow @dlu.edu.vn emails
      if (profile?.email && !profile.email.endsWith("@dlu.edu.vn")) {
        return false;
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
