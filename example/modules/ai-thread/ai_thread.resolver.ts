import { AiThreadService } from "./ai_thread.service.ts";

import {
  AbstractSubgraph,
  type Exchange,
  InjectExchange,
  InjectQueue,
  type Queue,
} from "@lqc/infrastructure";
import { Injectable } from "jsr:@exuanbo/di-wise";
import type {
  AiThread,
  Resolvers,
} from "./graphql/graphql.ts/types.generated.ts";
import { typeDefs } from "./graphql/graphql.ts/typeDefs.generated.ts";

@Injectable()
export class AiThreadResolver extends AbstractSubgraph<Resolvers<unknown>> {
  override path = "ai-thread/graphql";
  override typeDefs = typeDefs;

  private service = new AiThreadService();

  @InjectQueue("deno-test-queue")
  private testQueue!: Queue<AiThread>;

  @InjectExchange<AiThread>("deno-test")
  private testExchange!: Exchange<AiThread>;

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
