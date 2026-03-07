import "server-only";
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  expiresAt: Date;
}

const secretKey = process.env.AUTH_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h") // Reducido de 7d a 24h por seguridad
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch (error) {
    // No exponer detalles del error en producción
    if (process.env.NODE_ENV !== "production") {
      console.log("Failed to verify session");
    }
    return null;
  }
}

export async function createSession(userId: string, email: string) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  const session = await encrypt({ userId, email, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: true, // Siempre seguro (Vercel usa HTTPS)
    expires: expiresAt,
    sameSite: "strict", // Más restrictivo que "lax"
    path: "/",
  });
}

export async function updateSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const payload = await decrypt(session);

  if (!session || !payload) {
    return null;
  }

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: true,
    expires: expires,
    sameSite: "strict",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
