import type { Options } from "amqp-connection-manager";
import { type Constructor, Injectable, Scope, Scoped } from "di-wise";
import type { SubgraphType } from "../../graphql/subgraph.types.ts";
import type { IModule, IModuleBuilder } from "./feature_module.interfaces.ts";
import { ModuleBuilderToken } from "./tokens.ts";

/**
 * Implements the `IModuleBuilder` interface to build a `FeatureModule` instance.
 * Provides methods to register tasks for publishing events and subscribing to queues,
 * which are then executed when the `build` method is called.
 */

@Injectable<FeatureModuleBuilder>(ModuleBuilderToken)
@Scoped(Scope.Transient)
export class FeatureModuleBuilder implements IModuleBuilder {
  private publishEventsTasks: { exchange: string; queue: string }[] = [];
  private subscribeToQueueTasks: {
    queue: string;
    options?: {
      exchange?: string;
      routingKey?: string;
      queueOptions?: Options.AssertQueue;
    };
  }[] = [];
  private subGraphConstructor: Constructor<SubgraphType> | undefined;

  private moduleServices: Constructor<object>[] = [];
  private appServices: Constructor<object>[] = [];
  private infraServices: Constructor<object>[] = [];

  /**
   * Registers a task to publish events to the specified exchange and queue.
   * @param exchange - The exchange to publish events to.
   * @param queue - The queue to publish events to.
   * @returns The `FeatureModuleBuilder` instance for method chaining.
   */
  publishEvents(exchange: string, queue: string): IModuleBuilder {
    this.publishEventsTasks.push({ exchange, queue });
    return this;
  }

  subGraph(subgraph: Constructor<SubgraphType>): IModuleBuilder {
    this.subGraphConstructor = subgraph;
    return this;
  }

  /**
   * Registers a task to subscribe to the specified queue.
   * @param queue - The queue to subscribe to.
   * @returns The `FeatureModuleBuilder` instance for method chaining.
   */
  subscribeToQueue(
    queue: string,
    options?: {
      exchange?: string;
      routingKey?: string;
      queueOptions?: Options.AssertQueue;
    }
  ): IModuleBuilder {
    this.subscribeToQueueTasks.push({ queue, options: options || {} });
    return this;
  }

  /**
   * Registers a service to be included in the module.
   * @param service - The constructor for the service to be included.
   * @returns The `FeatureModuleBuilder` instance for method chaining.
   */
  service<T extends object>(service: Constructor<T>): IModuleBuilder {
    this.moduleServices.push(service);
    return this;
  }

  /**
   * Registers a service to be included in the module.
   * @param service - The constructor for the service to be included.
   * @returns The `FeatureModuleBuilder` instance for method chaining.
   */
  appService<T extends object>(service: Constructor<T>): IModuleBuilder {
    this.appServices.push(service);
    return this;
  }

  /**
   * Registers a service to be included in the module.
   * @param service - The constructor for the service to be included.
   * @returns The `FeatureModuleBuilder` instance for method chaining.
   */
  infraService<T extends object>(service: Constructor<T>): IModuleBuilder {
    this.infraServices.push(service);
    return this;
  }

  /**
   * Builds the `FeatureModule` instance by executing the registered tasks for publishing events and subscribing to queues.
   * @param module - The `FeatureModule` instance to build.
   * @returns The built `FeatureModule` instance.
   */
  async build(module: IModule): Promise<IModule> {
    const publishEventsTasks = this.publishEventsTasks.map(
      async ({ exchange, queue }) => {
        await module.publishEvents(exchange, queue);
      }
    );
    if (this.subGraphConstructor) {
      await module.subGraph(this.subGraphConstructor);
    }
    if (this.moduleServices.length > 0) {
      for (const service of this.moduleServices) {
        await module.service(service);
      }
    }
    if (this.appServices.length > 0) {
      for (const service of this.appServices) {
        await module.appService(service);
      }
    }
    if (this.infraServices.length > 0) {
      for (const service of this.infraServices) {
        await module.infraService(service);
      }
    }
    const subscribeToQueueTasks = this.subscribeToQueueTasks.map(
      async (queue) => {
        await module.subscribeToQueue(queue.queue, queue.options);
      }
    );
    await Promise.all([...publishEventsTasks, ...subscribeToQueueTasks]);
    return module as unknown as IModule;
  }
}
