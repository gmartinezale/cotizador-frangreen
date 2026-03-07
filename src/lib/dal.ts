import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import User from "@/models/user";
import { connectDB } from "@/lib/mongo";

export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect("/login");
  }

  return { isAuth: true, userId: session.userId, email: session.email };
});

export const getUser = cache(async () => {
  const session = await verifySession();
  if (!session) return null;

  try {
    await connectDB();
    const user = await User.findById(session.userId).select(
      "id name email createdAt"
    );

    return user;
  } catch (error) {
    console.log("Failed to fetch user");
    return null;
  }
});

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    return null;
  }

  return { userId: session.userId, email: session.email };
});
