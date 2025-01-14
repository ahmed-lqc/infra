import {
  AbstractSubgraph,
  injectExchange,
  injectQueue,
} from "@lqc/infrastructure";

import { inject, Injectable } from "di-wise";
import { typeDefs } from "./graphql/graphql.ts/typeDefs.generated.ts";
import type {
  AiThread,
  Resolvers,
} from "./graphql/graphql.ts/types.generated.ts";
import { AiThreadServiceToken } from "./services/ai-thread/token.ts";

@Injectable()
export class AiThreadResolver extends AbstractSubgraph<Resolvers<unknown>> {
  override path = "ai-thread/graphql";
  override typeDefs = typeDefs;

  constructor(
    private readonly service = inject(AiThreadServiceToken),
    private readonly testQueue = injectQueue<AiThread>("deno-test-queue"),
    private readonly testExchange = injectExchange<AiThread>("deno-test-queue")
  ) {
    super();
  }

  // Define the subscription logic as a class method so "this" is accessible
  private subscribeAiThreadCreated = async function* (
    this: AiThreadResolver,
    _parent: unknown,
    _args: Record<string, unknown>
  ) {
    // Now 'this' refers to AiThreadResolver instance
    const queue = this.testQueue;
    // The queue.subscribe() returns an AsyncIterable of messages
    for await (const _msg of queue.subscribe()) {
      // yield the messages under the subscription field name
      yield {
        aiThreadCreated: _msg,
      };
    }
  }.bind(this);

  resolvers: Resolvers<unknown> = {
    Query: {
      aiThread: (_, { id }) => {
        return this.service.getAiThread(id);
      },
    },
    Mutation: {
      createAiThread: () => {
        const aiThread: AiThread = {
          id: Math.floor(Math.random() * 1000).toString(),
          title: `Test Thread ${Math.random().toString(36).substring(7)}`,
          content: `Test content ${new Date().toISOString()}`,
        };
        this.testExchange.publish(aiThread);
        return aiThread;
      },
    },
    AiThread: {
      __resolveReference: (aiThread) => {
        return this.service.getAiThread(aiThread.id as string);
      },
    },
    Subscription: {
      aiThreadCreated: {
        subscribe: this.subscribeAiThreadCreated,
        resolve: (payload: { aiThreadCreated: AiThread }) =>
          payload.aiThreadCreated,
      },
    },
  };
}
