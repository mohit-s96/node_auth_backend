import { Resolver, Query, Mutation, Arg } from "type-graphql";
import { hash } from "bcryptjs";
import { User } from "./entity/User";

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
}
