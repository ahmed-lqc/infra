import {
  AbstractModuleHost,
  type IModuleBuilder,
  ModuleBuilder,
} from "@lqc/infrastructure";
import { AiThreadResolver } from "./ai_thread.resolver.ts";
import { AiThreadService } from "./services/ai-thread/ai_thread.service.ts";

@ModuleBuilder()
export class AiThreadModuleBuilder extends AbstractModuleHost {
  buildModule(builder: IModuleBuilder): IModuleBuilder {
    return builder
      .publishEvents<{ test: string }>("deno-test", "deno-test-queue")
      .subscribeToQueue<{ test: string }>("deno-test-queue")
      .service(AiThreadService)
      .subGraph(AiThreadResolver);
  }
}
