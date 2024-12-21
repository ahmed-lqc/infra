import { Type } from "di-wise";

import type { Options } from "amqplib";

export interface AmqpConnectionOptions {
  /**
   * A list of AMQP URLs that `amqp-connection-manager` can try in order.
   * Typically one URL is enough: [`amqp://user:pass@host:port/`].
   */
  urls: string[];

  /**
   * Additional connection options if needed, passed to `amqplib`.
   */
  connectionOptions?: Options.Connect;

  /**
   * Heartbeat interval in seconds. Defaults might be 10.
   */
  heartbeatIntervalInSeconds?: number;

  /**
   * Reconnect time in seconds. Defaults might be 10.
   */
  reconnectTimeInSeconds?: number;

  /**
   * A custom clientName for this connection, visible in RabbitMQ management UI.
   */
  clientName?: string;
}

export const AmqpConnectionOptionsToken: Type<AmqpConnectionOptions> = Type<
  AmqpConnectionOptions
>("AmqpConnectionOptions");
