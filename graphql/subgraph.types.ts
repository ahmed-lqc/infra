import type { YogaServerInstance } from "graphql-yoga";
import { Type } from "di-wise";

export interface SubgraphType {
  path: string;
  // deno-lint-ignore ban-types
  getServer(): YogaServerInstance<{}, {}>;
}

export const SubgraphToken = Type<SubgraphType>("SubgraphType");
