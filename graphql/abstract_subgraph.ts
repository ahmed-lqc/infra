import { buildSubgraphSchema } from "@apollo/subgraph";
import type { gql } from "https://deno.land/x/graphql_tag@0.1.2/mod.ts";

import type { GraphQLResolverMap } from "@apollo/subgraph/dist/schema-helper";
import { useDeferStream } from "@graphql-yoga/plugin-defer-stream";
import { useGraphQLSSE } from "@graphql-yoga/plugin-graphql-sse";
import { createYoga } from "graphql-yoga";
import type { SubgraphType } from "./subgraph.types.ts";
import { Inject } from "di-wise";
import {
  type ILoggerService,
  LoggerServiceToken,
} from "../common/logger/logger.types.ts";

export abstract class AbstractSubgraph<
  TResolvers extends Record<string, unknown>
> implements SubgraphType
{
  abstract typeDefs: ReturnType<typeof gql>;
  abstract path: string;

  abstract resolvers: TResolvers;
  @Inject(LoggerServiceToken)
  private logger!: ILoggerService;
  protected getRoot = (): GraphQLResolverMap<unknown> => {
    return {
      ...this.resolvers,
    } as GraphQLResolverMap<unknown>;
  };

  getServer() {
    const schema = buildSubgraphSchema([
      {
        typeDefs: this.typeDefs,
        resolvers: this.getRoot(),
      },
    ]);

    const yoga = createYoga({
      // graphqlEndpoint: this.path,
      logging: {
        debug: (msg) => this.logger.debug(msg),
        info: (msg) => this.logger.log(msg),
        warn: (msg) => this.logger.warn(msg),
        error: (msg) => this.logger.error(msg),
      },
      schema,
      plugins: [
        // useGraphQLSSE({ endpoint: this.path + "/stream" }),
        useGraphQLSSE(),
        useDeferStream(),
      ],
    });
    return yoga;
  }
}
