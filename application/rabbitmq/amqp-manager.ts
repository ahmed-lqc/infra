import { AutoRegister, Inject, Injectable, Scope, Scoped } from "di-wise";
import {
  type AmqpConnectionManager,
  connect as connectAMQP,
} from "amqp-connection-manager";

// @deno-types="npm:@types/amqplib@^0.10.6"
import type { ConfirmChannel, Options } from "amqplib";
import {
  type ILoggerService,
  LoggerServiceToken,
} from "../../common/logger/logger.types.ts";
import {
  type AmqpConnectionOptions,
  AmqpConnectionOptionsToken,
} from "./amqp-connection-options.token.ts";

/**
 * The `AmqpManager` class is responsible for managing the connection to an AMQP (Advanced Message Queuing Protocol) broker, such as RabbitMQ. It provides methods for initializing the connection, creating channels, setting up exchanges and queues, and closing the connection.
 *
 * The class uses dependency injection to obtain the necessary configuration options and a logger service.
 *
 * The `init()` method is used to establish the AMQP connection and create a default channel. The `getConnection()` and `getDefaultChannel()` methods can be used to access the connection and default channel, respectively.
 *
 * The `createNewChannel()` method allows creating a new channel, which can be used for more specialized AMQP operations. The `setupExchange()` and `setupQueue()` methods can be used to set up exchanges and queues on the AMQP broker.
 *
 * Finally, the `close()` method can be used to close the AMQP connection.
 */
@Injectable()
@Scoped(Scope.Container)
@AutoRegister()
export class AmqpManager {
  @Inject(LoggerServiceToken)
  private logger!: ILoggerService;

  @Inject(AmqpConnectionOptionsToken)
  private options!: AmqpConnectionOptions;

  private connection!: AmqpConnectionManager;
  private defaultChannel!: ConfirmChannel;
  private initialized = false;

  /**
   * Initializes the AMQP connection and creates a default channel.
   *
   * This method is responsible for establishing the connection to the AMQP broker, such as RabbitMQ, using the provided configuration options. It also creates a default channel that can be used for AMQP operations.
   *
   * If the AMQP Manager is already initialized, this method will log a warning and return early.
   *
   * The method uses the `connectAMQP` function from the `amqp-connection-manager` library to create the AMQP connection. It sets up event listeners for the `connect`, `disconnect`, and `connectFailed` events to handle the connection state.
   *
   * Once the connection is established, the method creates a default channel using the `createConfirmChannel` method and sets the `initialized` flag to `true`.
   */
  async init(): Promise<void> {
    if (this.initialized) {
      this.logger.warn("AMQP Manager is already initialized");
      return;
    }

    this.logger.log("Attempting to connect to AMQP...");

    this.connection = connectAMQP(this.options.urls, {
      heartbeatIntervalInSeconds: this.options.heartbeatIntervalInSeconds ?? 10,
      reconnectTimeInSeconds: this.options.reconnectTimeInSeconds ?? 10,
      connectionOptions: {
        ...(this.options.connectionOptions ?? {}),
        clientProperties: {
          clientName: this.options.clientName ?? "amqp-client",
        },
      },
    });

    await new Promise<void>((resolve, reject) => {
      this.connection.on("connect", () => {
        this.logger.log("AMQP connection established.");
        resolve();
      });

      this.connection.on("disconnect", ({ err }) => {
        this.logger.error("AMQP disconnected:", err?.message);
      });

      this.connection.on("connectFailed", ({ err }) => {
        this.logger.error("AMQP failed to connect:", err?.message);
        reject(err);
      });
    });

    this.defaultChannel = await this.createConfirmChannel(
      this.options.clientName ?? "amqp-client"
    );
    this.initialized = true;
  }

  /**
   * Creates a new AMQP confirm channel.
   *
   * This method is used internally to create a new AMQP channel that supports message confirmation. It wraps the `createChannel` method from the `amqp-connection-manager` library and waits for the channel to connect before returning it.
   *
   * @param name - The name to assign to the channel.
   * @returns A promise that resolves to the created `ConfirmChannel` instance.
   */
  private async createConfirmChannel(name: string): Promise<ConfirmChannel> {
    const channelWrapper = this.connection.createChannel({
      name,
    });

    await channelWrapper.waitForConnect();
    // @ts-ignore internal property
    return channelWrapper._channel;
  }

  /**
   * Returns the AMQP connection manager instance.
   *
   * This method can only be called after the AMQP manager has been initialized using the `init()` method. If the manager is not initialized, it will throw an error.
   *
   * @returns The AMQP connection manager instance.
   * @throws {Error} If the AMQP manager is not initialized.
   */
  getConnection(): AmqpConnectionManager {
    if (!this.initialized) {
      throw new Error(
        "AMQP Manager is not initialized yet. Call init() first."
      );
    }
    return this.connection;
  }

  /**
   * Returns the default AMQP channel.
   *
   * This method returns the default AMQP channel that was created during the initialization of the AMQP manager. If no default channel is available, it throws an error.
   *
   * @returns The default AMQP `ConfirmChannel` instance.
   * @throws {Error} If no default channel is available.
   */
  getDefaultChannel(): ConfirmChannel {
    if (!this.defaultChannel) {
      throw new Error("No default channel available");
    }
    return this.defaultChannel;
  }

  /**
   * Creates a new AMQP confirm channel.
   *
   * This method creates a new AMQP channel that supports message confirmation. It wraps the `createChannel` method from the `amqp-connection-manager` library and waits for the channel to connect before returning it.
   *
   * @param setup - An optional callback function that can be used to perform additional setup on the created channel.
   * @returns A promise that resolves to the created `ConfirmChannel` instance.
   */
  async createNewChannel(
    setup?: (channel: ConfirmChannel) => Promise<void>
  ): Promise<ConfirmChannel> {
    const channelWrapper = this.connection.createChannel({
      json: false,
      setup: setup || (async () => {}),
    });

    await channelWrapper.waitForConnect();
    // @ts-ignore private property
    return channelWrapper._channel;
  }

  /**
   * Asserts an AMQP exchange and logs a message when it is ready.
   *
   * This method creates or asserts an AMQP exchange with the specified name, type, and options. It then logs a message indicating that the exchange is ready.
   *
   * @param channel - The AMQP confirm channel to use for the exchange assertion.
   * @param exchange - The name of the AMQP exchange to assert.
   * @param type - The type of the AMQP exchange, defaulting to "topic".
   * @param options - Optional options for asserting the AMQP exchange.
   */
  async setupExchange(
    channel: ConfirmChannel,
    exchange: string,
    type: string = "topic",
    options?: Options.AssertExchange
  ): Promise<void> {
    await channel.assertExchange(exchange, type, options);
    this.logger.log(`Exchange "${exchange}" is ready.`);
  }

  /**
   * Asserts an AMQP queue and binds it to an exchange with a routing key, if provided.
   *
   * This method creates or asserts an AMQP queue with the specified name and options. If an exchange and routing key are provided, it binds the queue to the exchange with the specified routing key. It then logs messages indicating that the queue is ready and bound, if applicable.
   *
   * @param channel - The AMQP confirm channel to use for the queue assertion and binding.
   * @param queueName - The name of the AMQP queue to assert.
   * @param options - An object containing optional parameters for the queue assertion and binding:
   *   - exchange - The name of the AMQP exchange to bind the queue to (optional).
   *   - routingKey - The routing key to use when binding the queue to the exchange (optional).
   *   - queueOptions - Options for asserting the AMQP queue (optional).
   * @returns A promise that resolves to the name of the asserted queue.
   */
  async setupQueue(
    channel: ConfirmChannel,
    queueName: string,
    {
      exchange,
      routingKey,
      queueOptions,
    }: {
      exchange?: string;
      routingKey?: string;
      queueOptions?: Options.AssertQueue;
    } = {}
  ): Promise<string> {
    const { queue } = await channel.assertQueue(queueName, queueOptions);
    if (exchange && routingKey) {
      await channel.bindQueue(queue, exchange, routingKey);
      this.logger.log(
        `Queue "${queue}" bound to "${exchange}" with "${routingKey}"`
      );
    }
    this.logger.log(`Queue "${queue}" is ready.`);
    return queue;
  }

  async close(): Promise<void> {
    if (!this.initialized) return;

    this.logger.log("Closing AMQP connection...");
    await this.connection.close();
    this.logger.log("AMQP connection closed.");
    this.initialized = false;
  }
}
