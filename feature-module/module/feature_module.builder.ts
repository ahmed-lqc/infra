import { Injectable, Scope } from "di-wise";
import type { IModule, IModuleBuilder } from "./feature_module.interfaces.ts";
import type { FeatureModule } from "./feature_module.ts";
import { Scoped } from "di-wise";
import { ModuleBuilderToken } from "../tokens.ts";

/**
 * Implements the `IModuleBuilder` interface to build a `FeatureModule` instance.
 * Provides methods to register tasks for publishing events and subscribing to queues,
 * which are then executed when the `build` method is called.
 */

@Injectable<FeatureModuleBuilder>(ModuleBuilderToken)
@Scoped(Scope.Transient)
export class FeatureModuleBuilder implements IModuleBuilder {
  private publishEventsTasks: { exchange: string; queue: string }[] = [];
  private subscribeToQueueTasks: string[] = [];

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

  /**
   * Registers a task to subscribe to the specified queue.
   * @param queue - The queue to subscribe to.
   * @returns The `FeatureModuleBuilder` instance for method chaining.
   */
  subscribeToQueue(queue: string): IModuleBuilder {
    this.subscribeToQueueTasks.push(queue);
    return this;
  }

  /**
   * Builds the `FeatureModule` instance by executing the registered tasks for publishing events and subscribing to queues.
   * @param module - The `FeatureModule` instance to build.
   * @returns The built `FeatureModule` instance.
   */
  async build(module: FeatureModule): Promise<IModule> {
    const publishEventsTasks = this.publishEventsTasks.map(
      async ({ exchange, queue }) => {
        await module.publishEvents(exchange, queue);
      },
    );
    const subscribeToQueueTasks = this.subscribeToQueueTasks.map(
      async (queue) => {
        await module.subscribeToQueue(queue);
      },
    );
    await Promise.all([...publishEventsTasks, ...subscribeToQueueTasks]);
    return module;
  }
}
