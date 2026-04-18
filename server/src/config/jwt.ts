import jwt from "jsonwebtoken";
import { config } from "./index";

export interface JwtPayload {
  userId: string;
  name: string;
  email: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
};

export const verifyToken = (token: string): JwtPayload => {
  // Throws if token is invalid or expired — caller must handle
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};
