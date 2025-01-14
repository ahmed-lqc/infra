import type { AiThread } from "../../graphql/graphql.ts/types.generated.ts";

export interface IAiThreadService {
  getAiThread(id: string): AiThread;
}
