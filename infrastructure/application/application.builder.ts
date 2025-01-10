import { type Container, Inject, Injectable, Scope, Scoped } from "di-wise";
import type z from "zod";
import type {
  IApplication,
  IApplicationBuilder,
} from "./application.interface.ts";
import { AppBuilderToken, AppToken } from "./tokens.ts";
import type { IModuleBuilder } from "../feature-module/mods.ts";
import type { AmqpConnectionOptions } from "../rabbitmq/mod.ts";

/**
 * The ApplicationBuilder class is responsible for configuring and building an application instance.
 * It allows registering module builders, setting the application port, and configuring RabbitMQ URLs.
 * The built application can then be started by calling the `build()` method.
 */
@Injectable<ApplicationBuilder>(AppBuilderToken)
@Scoped(Scope.Container)
export class ApplicationBuilder implements IApplicationBuilder {
  private modules: IModuleBuilder[] = [];
  private rabbitmqOverrides?: Partial<AmqpConnectionOptions>;
  private port: number = 3000;
  private parentContainer!: Container;

  @Inject(AppToken)
  private app!: IApplication;

  setParentContainer(container: Container): IApplicationBuilder {
    this.parentContainer = container;
    return this;
  }

  /**
   * Registers a module builder with the application builder.
   * @param module - The module builder to register.
   * @returns The application builder instance for chaining.
   */
  registerModule(module: IModuleBuilder): IApplicationBuilder {
    this.modules.push(module);
    return this as unknown as IApplicationBuilder;
  }

  /**
   * Sets the port for the application.
   * @param port - The port number to set.
   * @returns The application builder instance for chaining.
   */
  setPort(port: number): IApplicationBuilder {
    this.port = port;
    return this;
  }

  /**
   * Sets the RabbitMQ URLs for the application.
   * @param urls - An array of RabbitMQ URLs to use.
   * @returns The application builder instance for chaining.
   */
  useRabbitmq(overrides?: Partial<AmqpConnectionOptions>): IApplicationBuilder {
    this.rabbitmqOverrides = overrides
      ? overrides
      : { urls: [Deno.env.get("RABBITMQ_URL")!] };
    return this;
  }

  withEnvConfig<SchemaType extends z.ZodRawShape>(
    schema: z.ZodObject<SchemaType>,
    partialOverrides?: Partial<z.infer<z.ZodObject<SchemaType>>>
  ): IApplicationBuilder {
    this.app.withEnvConfig(schema, partialOverrides);
    return this;
  }

  /**
   * Builds the application instance by registering modules, configuring RabbitMQ, and starting the application on the specified port.
   * @returns A Promise that resolves to the started application instance.
   */
  async build(): Promise<IApplication> {
    this.app.setParentContainer(this.parentContainer);
    if (this.rabbitmqOverrides) {
      await this.app.useRabbitmq(this.rabbitmqOverrides);
    }
    await Promise.all(
      this.modules.map((m) => m.build(this.app.createModule()))
    );
    return this.app.listen(this.port);
  }
}
