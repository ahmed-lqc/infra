import {
  type Constructor,
  type Container,
  createContainer,
  Scope,
} from "di-wise";
import { SubgraphToken, type SubgraphType } from "../graphql/subgraph.types.ts";
import { Buffer } from "node:buffer";

// @deno-types="@types/amqplib"
import type { Options } from "amqplib";

import { QueueToken } from "../application/rabbitmq/queue/queue.tokens.ts";
import { createQueue } from "../application/rabbitmq/queue/createQueue.ts";
import { AmqpManager, ExchangeToken } from "../application/mods.ts";
import {
  type ILoggerService,
  LoggerServiceToken,
} from "../common/logger/logger.types.ts";

export class FeatureModule implements FeatureModule {
  private container: Container;
  private appContainer: Container;
  constructor(appContainer: Container) {
    this.appContainer = appContainer;
    this.container = createContainer({ parent: appContainer });
  }

  addSubgraph(subgraph: Constructor<SubgraphType>) {
    this.container.register(SubgraphToken, { useClass: subgraph });
  }

  /**
   * Prepares a publisher for a given exchange.
   * Sets up the exchange using AmqpManager and registers a publisher object under ExchangeToken.
   *
   * @param exchangeName - The name of the RabbitMQ exchange to publish events to.
   * @returns A Promise that resolves to this application instance when the exchange is ready.
   */
  async publishEvents<MsgType>(
    exchangeName: string,
    routingKey: string,
  ): Promise<this> {
    const amqpManager = this.appContainer.resolve(AmqpManager);
    const channel = amqpManager.getDefaultChannel();
    const logger: ILoggerService = this.appContainer.resolve(
      LoggerServiceToken,
    );

    // Setup the exchange before creating the publisher
    await amqpManager.setupExchange(channel, exchangeName, "topic");

    // Create a publisher object

    // Register the publisher in the container
    const token = ExchangeToken<MsgType>(exchangeName);
    this.appContainer.register(
      token,
      {
        useFactory: () => ({
          publish: (message: MsgType) => {
            const buffer = Buffer.from(JSON.stringify(message));
            const confirmed = channel.publish(exchangeName, routingKey, buffer);
            if (!confirmed) {
              logger.error(
                `Failed to publish message to exchange ${exchangeName}`,
              );
              return false;
            }
            logger.log(`Published message to exchange ${exchangeName}`);
            return true;
          },
        }),
      },
      { scope: Scope.Container },
    );

    return this;
  }

  /**
   * Subscribes to a queue with the given name, ensuring the queue is set up.
   * This method:
   * - Retrieves the AmqpManager from the parent container.
   * - Sets up the queue using `amqpManager.setupQueue(...)`.
   * - Registers a `Queue<MsgType>` token with the queue name.
   * - Uses `createQueue(...)` to return an object implementing `Queue<MsgType>` that the rest of the module can inject.
   *
   * @param queueName The name of the queue to subscribe to.
   * @param exchange Optional exchange to bind the queue to.
   * @param routingKey Optional routing key for binding.
   * @returns A Promise that resolves to this FeatureModule for chaining.
   */
  async subscribeToQueue<MsgType>(
    queueName: string,
    {
      exchange,
      routingKey,
      queueOptions,
    }: {
      exchange?: string;
      routingKey?: string;
      queueOptions?: Options.AssertQueue;
    } = {},
  ): Promise<this> {
    const amqpManager = this.container.resolve(AmqpManager);
    const logger: ILoggerService = this.appContainer.resolve(
      LoggerServiceToken,
    );
    const channel = amqpManager.getDefaultChannel();

    // Ensure the queue is setup and ready
    const actualQueue = await amqpManager.setupQueue(channel, queueName, {
      exchange,
      routingKey,
      queueOptions,
    });

    // Create a token and a factory that returns a Queue<MsgType> object
    const token = QueueToken<MsgType>(queueName);

    // amqpManager has already initialized the connection
    const connection = amqpManager.getConnection();

    // createQueue returns an AsyncIterable-based queue instance
    this.container.register(
      token,
      {
        useFactory: () => createQueue<MsgType>(connection, actualQueue, logger),
      },
      { scope: Scope.Container },
    );

    return this;
  }

  getContainer(): Container {
    return this.container;
  }
}
