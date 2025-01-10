import { type Container, Scope, Scoped } from "di-wise";
import { SubgraphToken, type SubgraphType } from "../graphql/subgraph.types.ts";

import { Inject, Injectable } from "di-wise";
import type z from "zod";
import { LoggerService } from "../common/logger/logger-service.ts";
import {
  LoggerConfigToken,
  LoggerServiceToken,
} from "../common/logger/logger.types.ts";
import type { ConfigService } from "../config/config-service.ts";
import { ConfigServiceToken } from "../config/tokens.ts";
import { honoYogaMiddleware } from "../graphql/middleWare/yoga.middleware.ts";
import type { ServerRunner } from "../http/server-runner.ts";
import { ServerRunnerToken } from "../http/tokens.ts";
import type { IModule } from "../mod.ts";
import {
  type AmqpConnectionOptions,
  AmqpConnectionOptionsToken,
} from "../rabbitmq/amqp-connection-options.token.ts";
import { AmqpManager } from "../rabbitmq/amqp-manager.ts";
import { FeatureModule } from "../feature-module/module/feature_module.ts";
import type { IApplication } from "./application.interface.ts";
import { AppToken } from "./tokens.ts";

/**
 * The main application class that manages the lifecycle of the application,
 * including creating and registering feature modules and listening for incoming requests.
 * It can also integrate with RabbitMQ by using the AmqpManager.
 */
@Injectable<Application>(AppToken)
@Scoped(Scope.Container)
export class Application implements IApplication {
  readonly modules: FeatureModule[] = [];
  protected parentContainer!: Container;
  protected infraContainer!: Container;

  @Inject(ServerRunnerToken)
  private server!: ServerRunner;

  setParentContainer(infraContainer: Container): IApplication {
    this.infraContainer = infraContainer;
    this.parentContainer = infraContainer.createChild();
    return this;
  }

  /**
   * Creates and registers a feature module in the application.
   * @returns An instance of the created feature module.
   */
  createModule(): IModule {
    const moduleInstance = new FeatureModule(this.parentContainer);
    this.addModule(moduleInstance);
    return moduleInstance;
  }

  /**
   * Configures RabbitMQ using the AmqpManager.
   * Allows overriding default AMQP connection options Default is "RABBITMQ_URL" env var.
   * This method awaits the initialization of the AmqpManager, ensuring
   * the AMQP connection is established before returning.
   *
   * @param overrides - Partial AmqpConnectionOptions to override defaults.
   * @returns A Promise that resolves to the application instance.
   */
  async useRabbitmq(
    overrides?: Partial<AmqpConnectionOptions>
  ): Promise<IApplication> {
    const defaultOpts: AmqpConnectionOptions = {
      urls: [Deno.env.get("RABBITMQ_URL")!],
      heartbeatIntervalInSeconds: 10,
      reconnectTimeInSeconds: 10,
    };

    const finalOpts = { ...defaultOpts, ...overrides };

    // Register the AmqpConnectionOptions so AmqpManager can inject them
    this.parentContainer.register(AmqpConnectionOptionsToken, {
      useValue: finalOpts,
    });
    // Resolve the AmqpManager and init the connection
    const amqpManager = this.parentContainer.resolve(AmqpManager);
    await amqpManager.init();
    return this as unknown as IApplication;
  }
  /**
   * Adds a feature module to the application.
   * @param module - The feature module to add.
   * @returns The application instance.
   */
  addModule(module: FeatureModule): IApplication {
    this.modules.push(module);
    return this as unknown as IApplication;
  }

  /**
   * Example monadic method that reads environment (and optional overrides),
   * validates with Zod, and registers a ConfigService in the container.
   *
   * @param schema - a Zod schema describing the config shape
   * @param configName - a unique name for the config token (default: "AppEnvConfig")
   * @param partialOverrides - optional partial config to override environment or fallback
   * @returns this (for chaining)
   */
  withEnvConfig<Shape extends z.ZodRawShape>(
    schema: z.ZodObject<Shape>,
    partialOverrides?: Partial<z.infer<typeof schema>>
  ): IApplication {
    // 1) Attempt to read environment if allowed. If no permission, gracefully degrade or catch errors.
    const envData: Record<string, unknown> = {};
    try {
      for (const key of Object.keys(schema.shape)) {
        // attempt to read from env
        const val = Deno.env.get(key);
        if (val !== undefined) {
          // Optionally parse number, boolean, etc. This is naive string usage
          envData[key] = val;
        }
      }
    } catch {
      // If no --allow-env, skip or log
      // console.warn("Skipping environment reading: no permission or an error occurred.");
    }

    // 2) Merge envData with partialOverrides
    const merged: Record<string, unknown> = {
      ...envData,
      ...partialOverrides,
    };

    // 3) Validate with Zod (applies defaults if .default(...) is used in schema)
    const validatedConfig = schema.parse(merged);

    // 4) Create or retrieve a config token for this configName
    const configToken = ConfigServiceToken<z.infer<typeof schema>>();

    // 5) Create a small object implementing ConfigService<SchemaType>
    const configServiceImpl: ConfigService<z.infer<typeof schema>> = {
      getConfig(): z.infer<typeof schema> {
        return validatedConfig;
      },
    };

    // 6) Register it in the container
    this.infraContainer.register(configToken, {
      useValue: configServiceImpl,
    });

    return this as unknown as IApplication; // monadic chaining
  }

  /**
   * Listens for incoming requests on the specified port and sets up routes for each subgraph in the application's modules.
   * This method resolves the subgraphs from each module's container, creates a server instance for each subgraph,
   * and sets up the routes for the subgraphs on the application's server.
   * Finally, it starts the server on the specified port.
   *
   * @param port - The port number to listen on.
   * @returns A Promise that resolves to the application instance.
   */
  async listen(port: number): Promise<IApplication> {
    // Resolve subgraphs from each module's container
    for (const mod of this.modules) {
      const moduleContainer = mod.getContainer();
      const subgraphs: SubgraphType[] =
        moduleContainer.resolveAll(SubgraphToken);
      for (const subgraph of subgraphs) {
        const yoga = await subgraph.getServer();
        this.server.setRoute(subgraph.path, honoYogaMiddleware(yoga));
      }
    }
    await this.server.start(port);
    return this as unknown as IApplication;
  }
}
