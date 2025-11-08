import jwt from "jsonwebtoken";

export function signAuthToken(payload, secret, expiresIn = "7d") {
  if (!secret) throw new Error("JWT_SECRET not configured");
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAuthToken(token, secret) {
  if (!secret) throw new Error("JWT_SECRET not configured");
  return jwt.verify(token, secret);
}
