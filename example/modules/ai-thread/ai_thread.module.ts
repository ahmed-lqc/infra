import {
  AbstractModuleHost,
  type IModuleBuilder,
  ModuleHostToken,
} from "@lqc/infrastructure";
import { AiThreadResolver } from "./ai_thread.resolver.ts";
import { Injectable, Scope, Scoped } from "di-wise";

@Injectable(ModuleHostToken)
@Scoped(Scope.Container)
export class AiThreadModule extends AbstractModuleHost {
  buildModule(builder: IModuleBuilder): IModuleBuilder {
    return builder
      .publishEvents<{ test: string }>("deno-test", "deno-test-queue")
      .subscribeToQueue<{ test: string }>("deno-test-queue")
      .subGraph(AiThreadResolver);
  }
}
