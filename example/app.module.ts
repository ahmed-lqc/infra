import {
  type AbstractModuleHost,
  AppHost,
  type IAppBuilderNoRegisterModule,
} from "@lqc/infrastructure";
import type { Constructor } from "di-wise";
import { AiThreadModule } from "./modules/ai-thread/ai_thread.module.ts";
import { z } from "zod";

const configSchema = z.object({
  PORT: z.coerce.number(),
  RABBITMQ_URL: z.string(),
});

export class Application extends AppHost {
  override configSchema = configSchema;

  public override buildApp(
    builder: IAppBuilderNoRegisterModule
  ): void | Promise<void> {
    builder
      .useRabbitmq({
        urls: ["amqp://lc_user:secret@localhost:5672"],
      })
      .setPort(3000);
  }

  public override registerModules(
    registerModule: (module: Constructor<AbstractModuleHost>) => void
  ): void {
    registerModule(AiThreadModule);
  }
}
