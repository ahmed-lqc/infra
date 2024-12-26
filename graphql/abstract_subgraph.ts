import { buildSubgraphSchema } from "@apollo/subgraph";
import type { gql } from "graphql-tag";

import type { GraphQLResolverMap } from "@apollo/subgraph/dist/schema-helper";
import { useDeferStream } from "@graphql-yoga/plugin-defer-stream";
import { useGraphQLSSE } from "@graphql-yoga/plugin-graphql-sse";
import { inject } from "di-wise";
import { createYoga, type YogaServerInstance } from "graphql-yoga";
import { LoggerServiceToken } from "../common/logger/logger.types.ts";
import type { SubgraphType } from "./subgraph.types.ts";

export abstract class AbstractSubgraph<
  TResolvers extends Record<string, unknown>,
> implements SubgraphType {
  abstract typeDefs: ReturnType<typeof gql>;
  abstract path: string;

  abstract resolvers: TResolvers;

  private logger = inject(LoggerServiceToken);

  protected getRoot = (): GraphQLResolverMap<unknown> => {
    return {
      ...this.resolvers,
    } as GraphQLResolverMap<unknown>;
  };

  getServer(): YogaServerInstance<
    Record<string | number | symbol, never>,
    Record<string | number | symbol, never>
  > {
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
    return yoga as unknown as YogaServerInstance<
      Record<string | number | symbol, never>,
      Record<string | number | symbol, never>
    >;
  }
}
