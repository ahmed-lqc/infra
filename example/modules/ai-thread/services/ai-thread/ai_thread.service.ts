import { Injectable } from "di-wise";
import type { AiThread } from "../../graphql/graphql.ts/types.generated.ts";
import type { IAiThreadService } from "./ai-thread-service.type.ts";
import { AiThreadServiceToken } from "./token.ts";

@Injectable(AiThreadServiceToken)
export class AiThreadService implements IAiThreadService {
  getAiThread(id: string): AiThread {
    return {
      id,
      title: "Mock Thread",
      content: "This is a mock AI thread content.",
    };
  }
}
