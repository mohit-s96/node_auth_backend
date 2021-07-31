import { User } from "./entity/User";
import { sign } from "jsonwebtoken";

export const createAccessToken = (user: User, tLimit: string) => {
  return sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: tLimit }
  );
};
export const createRefreshToken = (user: User, tLimit: string) => {
  return sign(
    {
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: tLimit }
  );
};
