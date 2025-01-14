import {
  AppHost,
  type AbstractModuleHost,
  type IAppBuilderNoRegisterModule,
} from "@lqc/infrastructure";
import type { Constructor } from "di-wise";
import { z } from "zod";
import { AiThreadModuleBuilder } from "./modules/ai-thread/ai_thread.module.ts";

const configSchema = z.object({
  PORT: z.coerce.number().default(3000),
  RABBITMQ_URL: z.string().default("amqp://lc_user:secret@localhost:5672"),
});

type ConfigType = typeof configSchema;
export class Application extends AppHost<typeof configSchema.shape> {
  override configSchema = configSchema;

  public override buildApp(
    builder: IAppBuilderNoRegisterModule<ConfigType>
  ): void | Promise<void> {
    const config = this.configService.getConfig();
    builder
      .useRabbitmq({
        urls: [config.RABBITMQ_URL],
      })
      .setPort(config.PORT);
  }

  public override registerModules(
    registerModule: (module: Constructor<AbstractModuleHost>) => void
  ): void {
    registerModule(AiThreadModuleBuilder);
  }
}
