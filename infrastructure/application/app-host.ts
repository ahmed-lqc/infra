import { type Constructor, type Container, createContainer } from "di-wise";
import type { ZodTypeAny } from "zod";
import {
  LoggerConfigToken,
  LoggerServiceToken,
} from "../common/logger/logger.types.ts";
import { LoggerService } from "../common/mods.ts";
import {
  FeatureModuleBuilder,
  type IModuleBuilder,
  ModuleBuilderToken,
  ModuleHostToken,
} from "../feature-module/mods.ts";
import type { AbstractModuleHost } from "../feature-module/module/module-host.ts";
import { HonoServerRunner } from "../http/hono-server-runner.ts";
import { ApplicationBuilder } from "./application.builder.ts";
import type {
  IAppBuilderNoRegisterModule,
  IApplicationBuilder,
} from "./application.interface.ts";
import { Application } from "./application.ts";
import { AppBuilderToken } from "./tokens.ts";

/**
 * Builds and returns a DI container with the necessary registrations for the application.
 * This includes registering the `ApplicationBuilder`, `FeatureModuleBuilder`, and `HonoServerRunner`.
 * The container can then be used to resolve these dependencies throughout the application.
 */
export function buildContainer(): Container {
  const container = createContainer();
  container.register(ApplicationBuilder);
  container.register(Application);
  container.register(FeatureModuleBuilder);
  container.register(HonoServerRunner);
  container.register(LoggerConfigToken, {
    useValue: { hideFields: ["password", "token", "access_token", "secret"] },
  });
  container.register(LoggerServiceToken, {
    useClass: LoggerService,
  });

  return container;
}

/**
 * Abstract base class for an application host which:
 * 1) Creates a DI container with an ApplicationBuilder singleton.
 * 2) Exposes `run()` method that automatically:
 *    - builds each module host
 *    - registers the resulting IModuleBuilder with the application builder
 *    - delegates final config to an abstract buildApp(...) method
 *    - calls .build() on the application builder
 */
export abstract class AppHost {
  protected readonly container: Container = buildContainer();

  protected appBuilder!: IApplicationBuilder;

  constructor() {
    // Recreate container? Or just use the one from property initialization
    // If you prefer the same container instance, remove this line.
    this.container = buildContainer();
    this.appBuilder = this.container.resolve(AppBuilderToken);
    this.appBuilder.setParentContainer(this.container);
  }

  abstract configSchema: ZodTypeAny;
  /**
   * A protected method that is responsible for finalizing application configuration
   * (e.g. setting port, RabbitMQ, etc.) but excludes 'registerModule'.
   *
   * The user can only call setPort, useRabbitmq, build, etc.
   */
  public abstract buildApp(
    builder: IAppBuilderNoRegisterModule
  ): void | Promise<void>;

  /**
   * Registers the provided module host with the application builder.
   * This method is called for each module host to build and register the resulting module builder.
   *
   * @param module The module host to build and register.
   */
  public abstract registerModules(
    registerModule: (module: Constructor<AbstractModuleHost>) => void
  ): void;

  /**
   * The main method that orchestrates:
   *  1) For each moduleHost in `moduleHosts`, call .buildModule() => IModuleBuilder
   *  2) appBuilder.registerModule(...) for each builder
   *  3) create a builderNoRegister that excludes registerModule
   *  4) call buildApp(builderNoRegister)
   *  5) finally, appBuilder.build()
   */
  async run(): Promise<void> {
    if (this.configSchema) {
      this.appBuilder.withEnvConfig(this.configSchema);
    }
    this.registerModules((module: Constructor<AbstractModuleHost>) => {
      this.container.register(ModuleHostToken, {
        useClass: module,
      });
    });
    const moduleHosts = this.container.resolveAll(ModuleHostToken);
    // 1) Build each module host & register the resulting module builder
    for (const host of moduleHosts) {
      const moduleBuilder: IModuleBuilder = (
        host as AbstractModuleHost
      ).buildModule(this.container.resolve(ModuleBuilderToken));
      this.appBuilder.registerModule(moduleBuilder);
    }

    // 2) Construct a version of the appBuilder that excludes 'registerModule'
    const builderNoRegister: IAppBuilderNoRegisterModule = {
      setPort: this.appBuilder.setPort.bind(this.appBuilder),
      useRabbitmq: this.appBuilder.useRabbitmq.bind(this.appBuilder),
      build: this.appBuilder.build.bind(this.appBuilder),
      setParentContainer: this.appBuilder.setParentContainer.bind(
        this.appBuilder
      ),
    };
    builderNoRegister.setParentContainer(this.container);
    // 3) Let the subclass do final configuration
    await this.buildApp(builderNoRegister);

    // 4) Build the app
    await this.appBuilder.build();
  }
}
