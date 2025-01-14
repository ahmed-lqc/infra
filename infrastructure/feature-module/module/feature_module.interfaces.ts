import type { Constructor } from "di-wise";
import type { SubgraphType } from "../../mod.ts";
// @deno-types="@types/amqplib"
import type { Options } from "amqplib";

export interface IModule {
  publishEvents<MsgType>(
    exchangeName: string,
    routingKey: string
  ): Promise<IModule>;
  subscribeToQueue<MsgType>(
    queueName: string,
    options?: {
      exchange?: string;
      routingKey?: string;
      queueOptions?: Options.AssertQueue;
    }
  ): Promise<IModule>;
  subGraph(subgraph: Constructor<SubgraphType>): IModule;
  service<T extends object>(service: Constructor<T>): IModule;
  appService<T extends object>(service: Constructor<T>): IModule;
  infraService<T extends object>(service: Constructor<T>): IModule;
}

export interface IModuleBuilder {
  subGraph(subgraph: Constructor<SubgraphType>): IModuleBuilder;
  publishEvents<MsgType>(exchange: string, queue: string): IModuleBuilder;
  subscribeToQueue<MsgType>(
    queue: string,
    options?: {
      exchange?: string;
      routingKey?: string;
      queueOptions?: Options.AssertQueue;
    }
  ): IModuleBuilder;
  service<T extends object>(service: Constructor<T>): IModuleBuilder;
  appService<T extends object>(service: Constructor<T>): IModuleBuilder;
  infraService<T extends object>(service: Constructor<T>): IModuleBuilder;
  build(module: IModule): Promise<IModule>; // building returns a fully configured module
}
