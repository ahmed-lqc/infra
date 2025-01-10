/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
import type { Resolvers } from "./types.generated.ts";
import { aiThread as Query_aiThread } from "../resolvers/Query/aiThread.ts";
import { createAiThread as Mutation_createAiThread } from "../resolvers/Mutation/createAiThread.ts";
import { aiThreadCreated as Subscription_aiThreadCreated } from "./../resolvers/Subscription/aiThreadCreated.ts";
import { AiThread } from "./../resolvers/AiThread.ts";

// deno-lint-ignore ban-types
export const resolvers: Resolvers<{}> = {
  Query: { aiThread: Query_aiThread },
  Mutation: { createAiThread: Mutation_createAiThread },
  Subscription: { aiThreadCreated: Subscription_aiThreadCreated },
  AiThread: AiThread,
};
