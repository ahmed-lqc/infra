import { Type } from "di-wise";

/**
 * Represents a queue that can be subscribed to for asynchronous message processing.
 * The `subscribe()` method returns an `AsyncIterable` that can be used to consume messages from the queue.
 */
export interface Queue<MsgType> {
  subscribe(): AsyncIterable<MsgType>;
}

// A global cache for queue tokens
const queueTokenCache = new Map<string, Type<Queue<unknown>>>();

/**
 * Creates a `Type` token for a `Queue` implementation with the specified queue name.
 * If called multiple times with the same queueName, returns the same token instance.
 *
 * @param queueName - The name of the queue to create a token for.
 * @returns A `Type` token for a `Queue` implementation with the specified queue name.
 */
export function QueueToken<MsgType>(queueName: string): Type<Queue<MsgType>> {
  if (queueTokenCache.has(queueName)) {
    return queueTokenCache.get(queueName)! as Type<Queue<MsgType>>;
  }

  const token = Type<Queue<MsgType>>(`Queue<${queueName}>`);
  queueTokenCache.set(queueName, token as Type<Queue<unknown>>);
  return token;
}
