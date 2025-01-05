import type { Constructor } from "di-wise";
import type { SubgraphType } from "../../mod.ts";
// @deno-types="@types/amqplib"
import type { Options } from "amqplib";

export interface IModule {
  publishEvents<MsgType>(
    exchangeName: string,
    routingKey: string,
  ): Promise<IModule>;
  subscribeToQueue<MsgType>(
    queueName: string,
    options: {
      exchange?: string;
      routingKey?: string;
      queueOptions?: Options.AssertQueue;
    },
  ): Promise<IModule>;
  addSubgraph(subgraph: Constructor<SubgraphType>): IModule;
}

export interface IModuleBuilder {
  publishEvents(exchange: string, queue: string): IModuleBuilder;
  subscribeToQueue(queue: string): IModuleBuilder;
  build(module: IModule): Promise<IModule>; // building returns a fully configured module
}
