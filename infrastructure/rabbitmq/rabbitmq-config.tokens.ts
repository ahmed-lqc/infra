import { Type } from "di-wise";
import type { AmqpConnectionManager } from "amqp-connection-manager";

/**
 * Represents the configuration for a RabbitMQ connection.
 *
 * @property {string} url - The connection URL for the RabbitMQ server, e.g. `amqp://user:pass@host:port/vhost`.
 */
export interface RabbitMQConfig {
  url: string; // e.g. amqp://user:pass@host:port/vhost
}

/**
 * A token representing the configuration for a RabbitMQ connection.
 * This token can be used to inject the RabbitMQConfig object into other parts of the application.
 */
export const RabbitMQConfigToken = Type<RabbitMQConfig>("RabbitMQConfig");

/**
 * A token representing the connection manager for a RabbitMQ connection.
 * This token can be used to inject the RabbitMQ connection manager into other parts of the application.
 */
export const RabbitMQConnectionToken = Type<Promise<AmqpConnectionManager>>(
  "RabbitMQConnection",
);
