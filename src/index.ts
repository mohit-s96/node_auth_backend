require("dotenv").config();
const cors = require("cors");
import "reflect-metadata";
import cookieParser from "cookie-parser";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./UserResolver";
import { createConnection } from "typeorm";
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { createAccessToken, createRefreshToken } from "./auth";

(async () => {
  const app = express();
  app.use(cookieParser());
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
  app.get("/", (_req, res) => {
    res.send("Hello");
  });

  app.post("/rfrt", async (req, res) => {
    const token = req.cookies.jid;
    if (!token) {
      res.status(401);
      return res.json({
        error: "Unauthorized",
        accessToken: "",
      });
    }
    let payload: any = null;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (error) {
      console.log(error);
      res.status(401);
      return res.json({
        error: "Unauthorized",
        accessToken: "",
      });
    }
    const user = await User.findOne({ id: payload.userId });
    if (!user) {
      res.status(401);
      return res.json({
        error: "Unauthorized",
        accessToken: "",
      });
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      res.status(401);
      return res.json({
        error: "Unauthorized",
        accessToken: "",
      });
    }
    res.cookie("jid", createRefreshToken(user, "7d"), {
      httpOnly: true,
    });
    res.status(200);
    return res.json({ accessToken: createAccessToken(user, "5m"), error: "" });
  });

  await createConnection();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
    }),
    context: ({ req, res }) => ({ req, res }),
  });
  apolloServer.applyMiddleware({ app, cors: false });
  app.listen(4000, () => {
    console.log("Started server");
  });
})();
