import type z from "zod";
import type {
  IModule,
  IModuleBuilder,
} from "../feature-module/module/feature_module.interfaces.ts";
import type { AmqpConnectionOptions } from "../rabbitmq/amqp-connection-options.token.ts";
import type { Container } from "di-wise";

/**
 * Defines an interface for an application that can listen on a specified port.
 * The `listen` method starts the application and listens on the provided port, returning a Promise that resolves when the application is ready to accept requests.
 */
export interface IApplication {
  setParentContainer(parentContainer: Container): IApplication;
  listen(port: number): Promise<IApplication>;

  addModule(module: IModule): IApplication;
  createModule(): IModule;
  useRabbitmq(overrides: Partial<AmqpConnectionOptions>): Promise<IApplication>;
  withEnvConfig<Shape extends z.ZodRawShape>(
    schema: z.ZodObject<Shape>,
    partialOverrides?: Partial<z.infer<typeof schema>>
  ): IApplication;
}

/**
 * Defines an interface for an application builder that can register modules.
 * The `registerModule` method allows adding a module to the application builder.
 * The `setPort` method sets the port for the application.
 * The `useRabbitmq` method configures the application to use RabbitMQ with the provided URLs.
 * The `build` method builds the application and returns a Promise that resolves when the application is ready to listen.
 */
export interface IApplicationBuilder {
  setParentContainer(container: Container): IApplicationBuilder;
  registerModule(module: IModuleBuilder): IApplicationBuilder; // any for brevity
  setPort(port: number): IApplicationBuilder;
  useRabbitmq(overrides: Partial<AmqpConnectionOptions>): IApplicationBuilder;
  withEnvConfig(schema: z.ZodTypeAny): IApplicationBuilder;
  overrideEnvConfig(
    partialOverrides: Record<string, unknown>
  ): IApplicationBuilder;

  build(): Promise<IApplication>;
}

/**
 * An interface that defines an application builder without the `registerModule` method.
 * This can be useful when you want to create an application builder that doesn't allow registering modules.
 */
export type IAppBuilderNoRegisterModule = Omit<
  IApplicationBuilder,
  "registerModule" | "withEnvConfig"
>;

/**
 * Defines an interface for an application builder that can register modules.
 * The `registerModule` method allows adding a module to the application builder.
 */
export interface IRegisterModuleOnly {
  registerModule(module: IModuleBuilder): IApplicationBuilder;
}
