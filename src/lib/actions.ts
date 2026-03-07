"use server";

import { z } from "zod";
import { connectDB } from "@/lib/mongo";
import User from "@/models/user";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { checkRateLimit, getClientIP, safeErrorLog } from "@/lib/security";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .trim(),
});

export type FormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export async function authenticate(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // Rate limiting: 5 intentos por minuto por IP
  const clientIP = await getClientIP();
  const rateLimitResult = await checkRateLimit(`login:${clientIP}`, {
    windowMs: 60000, // 1 minuto
    maxRequests: 5,  // 5 intentos máximos
  });

  if (!rateLimitResult.success) {
    return {
      message: "Demasiados intentos. Espera un momento antes de intentar de nuevo.",
    };
  }

  // 1. Validate form fields
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 2. Check user credentials
  const { email, password } = validatedFields.data;

  try {
    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      return {
        message: "Invalid credentials.",
      };
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return {
        message: "Invalid credentials.",
      };
    }

    // 3. Create user session
    await createSession(user._id.toString(), user.email);

    // 4. Redirect user
  } catch (error) {
    safeErrorLog("Login error", error);
    return {
      message: "An error occurred while logging in.",
    };
  }

  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
