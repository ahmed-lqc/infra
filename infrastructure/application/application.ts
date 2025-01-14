import { type Container, Scope, Scoped } from "di-wise";
import { SubgraphToken, type SubgraphType } from "../graphql/subgraph.types.ts";

import { Inject, Injectable } from "di-wise";
import { FeatureModule } from "../feature-module/module/feature_module.ts";
import { honoYogaMiddleware } from "../graphql/middleWare/yoga.middleware.ts";
import type { ServerRunner } from "../http/server-runner.ts";
import { ServerRunnerToken } from "../http/tokens.ts";
import type { IModule } from "../mod.ts";
import {
  type AmqpConnectionOptions,
  AmqpConnectionOptionsToken,
} from "../rabbitmq/amqp-connection-options.token.ts";
import { AmqpManager } from "../rabbitmq/amqp-manager.ts";
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

  /**
   * Sets the parent container for the application and creates a child container.
   * This allows the application to have a separate container for infrastructure-level dependencies.
   * @param infraContainer - The infrastructure-level container to use as the parent.
   * @returns The application instance.
   */
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
    const moduleInstance = new FeatureModule(
      this.parentContainer,
      this.infraContainer
    );
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
    return this;
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
