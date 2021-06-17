import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ObjectType,
  Field,
  Ctx,
  UseMiddleware,
  Int,
} from "type-graphql";
import { compare, hash } from "bcryptjs";
import { User } from "./entity/User";
import { MyContext } from "./Context";
import { createAccessToken, createRefreshToken } from "./auth";
import { authMW } from "./authMW";
import { getConnection } from "typeorm";

@ObjectType()
class LoginResponse {
  @Field()
  accessToken?: string;
  @Field()
  error?: string;
}

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return "hemlo";
  }
  @Query(() => String)
  @UseMiddleware(authMW)
  authRoute(@Ctx() { payload }: MyContext) {
    return `Your user id is: ${payload?.userId} and email is: ${payload?.email}`;
  }
  @Query(() => [User])
  async getDB() {
    const data = await User.query("SELECT * FROM users");
    return data;
  }
  @Mutation(() => Boolean)
  async removeUser(@Arg("id") id: number) {
    const user = await User.findOne(id);
    if (user) {
      await User.remove(user);
      return true;
    } else {
      return false;
    }
  }
  @Mutation(() => Boolean)
  async register(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Arg("age") age: number
  ) {
    try {
      const hashedPass = await hash(password, 12);
      await User.insert({
        email,
        password: hashedPass,
        age,
      });
    } catch (err) {
      console.log(err);
      return false;
    }
    return true;
  }
  @Mutation(() => LoginResponse)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email } });
    try {
      if (!user) {
        throw new Error("User not found");
      }
      const valid = await compare(password, user.password);
      if (!valid) {
        throw new Error("Wrong Info");
      }
    } catch (err) {
      console.log(err);
      return {
        error: err.message,
        accessToken: "",
      };
    }
    res.cookie("jid", createRefreshToken(user, "7d"), {
      httpOnly: true,
    });
    return {
      accessToken: createAccessToken(user, "15m"),
      error: "",
    };
  }
  @Mutation(() => Boolean)
  async revokeTokens(@Arg("userId", () => Int) userId: number) {
    await getConnection()
      .getRepository(User)
      .increment({ id: userId }, "tokenVersion", 1);
    return true;
  }
}
