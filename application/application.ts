import { type Container, createContainer } from "di-wise";
import { Hono } from "hono";
import { FeatureModule } from "../feature/feature_module.ts";
import { SubgraphToken, type SubgraphType } from "../graphql/subgraph.types.ts";

import { LoggerService } from "../common/logger/logger-service.ts";
import {
  LoggerConfigToken,
  LoggerServiceToken,
} from "../common/logger/logger.types.ts";
import {
  type AmqpConnectionOptions,
  AmqpConnectionOptionsToken,
} from "./rabbitmq/amqp-connection-options.token.ts";
import { AmqpManager } from "./rabbitmq/amqp-manager.ts";
import { honoYogaMiddleware } from "./middleWare/yoga.middleware.ts";

/**
 * The main application class that manages the lifecycle of the application,
 * including creating and registering feature modules and listening for incoming requests.
 * It can also integrate with RabbitMQ by using the AmqpManager.
 */
export class Application {
  private app = new Hono();
  private modules: FeatureModule[] = [];
  private parentContainer: Container;

  constructor() {
    // Create the application's main container
    this.parentContainer = createContainer();
  }

  /**
   * Creates and registers a feature module in the application.
   * @returns An instance of the created feature module.
   */
  createModule(): FeatureModule {
    const moduleInstance = new FeatureModule(this.parentContainer);
    this.addModule(moduleInstance);
    return moduleInstance;
  }

  /**
   * Configures RabbitMQ using the AmqpManager.
   * Allows overriding default AMQP connection options.
   * This method awaits the initialization of the AmqpManager, ensuring
   * the AMQP connection is established before returning.
   *
   * @param overrides - Partial AmqpConnectionOptions to override defaults.
   * @returns A Promise that resolves to the application instance.
   */
  async useRabbitmq(overrides?: Partial<AmqpConnectionOptions>): Promise<this> {
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

    this.parentContainer.register(LoggerConfigToken, {
      useValue: { hideFields: ["password", "token", "access_token", "secret"] },
    });

    this.parentContainer.register(LoggerServiceToken, {
      useClass: LoggerService,
    });
    // Resolve the AmqpManager and init the connection
    const amqpManager = this.parentContainer.resolve(AmqpManager);
    await amqpManager.init();
    return this;
  }

  /**
   * Adds a feature module to the application.
   * @param module - The feature module to add.
   * @returns The application instance.
   */
  private addModule(module: FeatureModule): this {
    this.modules.push(module);
    return this;
  }

  /**
   * Listens for incoming requests on the specified port and routes them to the appropriate subgraphs.
   * This method resolves all subgraphs registered in the application's modules,
   * creates a Yoga server for each subgraph, and sets up routes to handle requests to each subgraph's path.
   *
   * @param port - The port number to listen on.
   * @returns The application instance.
   */
  async listen(port: number): Promise<this> {
    // Resolve subgraphs from each module's container
    for (const mod of this.modules) {
      const moduleContainer = mod.getContainer();
      const subgraphs: SubgraphType[] = moduleContainer.resolveAll(
        SubgraphToken,
      );
      for (const subgraph of subgraphs) {
        const yoga = await subgraph.getServer();
        // deno-lint-ignore no-explicit-any
        this.app.all(subgraph.path, honoYogaMiddleware(yoga as any));
      }
    }
    await Deno.serve({ port }, this.app.fetch);
    return this;
  }
}
