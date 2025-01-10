import type { AmqpConnectionManager, Channel } from "amqp-connection-manager";

// @deno-types="npm:@types/amqplib@^0.10.6"
import type { Message } from "amqplib";
import type { Queue } from "./queue.tokens.ts";
import type { ILoggerService } from "../../common/mods.ts";

/**
 * Creates a RabbitMQ queue and returns an async iterable that can be used to subscribe to messages from the queue.
 *
 * @param connection - The AMQP connection manager to use for creating the queue.
 * @param queueName - The name of the queue to create.
 * @returns An object with a `subscribe` method that returns an async iterable of messages from the queue.
 */
export function createQueue<MsgType>(
  connection: AmqpConnectionManager,
  queueName: string,
  logger: ILoggerService,
): Queue<MsgType> {
  let push: ((value: MsgType) => void) | null = null;
  let done: (() => void) | null = null;
  const messages: MsgType[] = [];

  /**
   * An async generator function that yields messages from a queue.
   *
   * This function is used internally by the `createQueue` function to provide an async iterable
   * that can be used to subscribe to messages from a RabbitMQ queue.
   *
   * The generator function will wait for messages to be pushed to the `messages` array, and
   * then yield each message one by one. If the `messages` array is empty and there are no
   * pending pushes or completion signals, the generator will return.
   */
  async function* generator() {
    while (true) {
      if (messages.length === 0) {
        await new Promise<void>((resolve) => {
          push = (msg: MsgType) => {
            messages.push(msg);
            push = null;
            resolve();
          };
          done = () => {
            done = null;
            resolve();
          };
        });
      }
      if (messages.length === 0 && !push && !done) return;
      while (messages.length > 0) {
        yield messages.shift()!;
      }
    }
  }

  /**
   * An async iterable that yields messages from the RabbitMQ queue.
   * This iterable is returned by the `subscribe` method of the `createQueue` function.
   */
  const asyncIterable = generator();
  connection.createChannel({
    setup: async (channel: Channel, _callback: (error?: Error) => void) => {
      await channel.assertQueue(queueName, { durable: true });
      await channel.consume(queueName, (msg: Message | null) => {
        if (msg !== null) {
          const content = JSON.parse(msg.content.toString()) as MsgType;
          logger.log(`Received message from queue ${queueName}`);
          if (push) {
            push(content);
          } else {
            messages.push(content);
          }
          channel.ack(msg);
        }
      });
    },
  });

  return {
    /**
     * Returns an async iterable that can be used to subscribe to messages from a RabbitMQ queue.
     * The iterable will yield messages as they are received from the queue.
     */
    subscribe() {
      return asyncIterable;
    },
  };
}
