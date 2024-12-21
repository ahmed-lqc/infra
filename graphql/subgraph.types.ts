import type { YogaServerInstance } from "graphql-yoga";
import { Type } from "di-wise";

export interface SubgraphType {
  path: string;
  getServer(): YogaServerInstance<
    Record<string | number | symbol, never>,
    Record<string | number | symbol, never>
  >;
}

export const SubgraphToken: Type<SubgraphType> = Type<SubgraphType>(
  "SubgraphType",
);
