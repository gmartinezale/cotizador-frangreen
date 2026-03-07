import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { connectDB } from "./lib/mongo";
import User, { IUser } from "./models/user";
import { z } from "zod";

async function getUserByEmail(email: string): Promise<IUser | null> {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    console.error("Error al buscar el usuario por email:", error);
    throw error;
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        await connectDB();
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;

        const user = await getUserByEmail(email);
        if (!user) return null;
        const isValid = await user.validatePassword(password);
        if (!isValid) return null;
        return user;
      },
    }),
  ],
});
