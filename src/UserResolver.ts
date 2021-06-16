import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ObjectType,
  Field,
  Ctx,
} from "type-graphql";
import { compare, hash } from "bcryptjs";
import { User } from "./entity/User";
import { MyContext } from "./Context";
import { createAccessToken, createRefreshToken } from "./auth";

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
    return "hemlo ";
  }
  @Query(() => [User])
  async getDB() {
    const data = await User.query("SELECT * FROM users");
    return data;
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
}
