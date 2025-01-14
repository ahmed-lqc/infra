import { type ClassFieldDecorator, inject, Inject } from "di-wise";
import { type Queue, QueueToken } from "./queue.tokens.ts";

/**
 * A decorator function that injects a RabbitMQ queue instance into a class field.
 *
 * @param queueName - The name of the RabbitMQ queue to be injected.
 * @returns A decorator function that can be applied to a class field.
 */
export function InjectQueue<MsgType = unknown>(
  queueName: string
): ClassFieldDecorator<Queue<MsgType>> {
  const token = QueueToken<MsgType>(queueName);
  return Inject(token) as ClassFieldDecorator<Queue<MsgType>>;
}

export function injectQueue<MsgType = unknown>(
  queueName: string
): Queue<MsgType> {
  const token = QueueToken<MsgType>(queueName);
  return inject(token);
}
