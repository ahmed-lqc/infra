import { Type } from "di-wise";

/**
 * Defines an interface for an Exchange implementation that can publish messages of type `MsgType` to a RabbitMQ exchange.
 *
 * @template MsgType - The type of the messages that can be published to the exchange.
 */
export interface Exchange<MsgType> {
  publish(message: MsgType): boolean;
}

/**
 * A cache that stores `Type<Exchange<unknown>>` instances keyed by the exchange name.
 * This cache is used by the `ExchangeToken` function to ensure that the same token is returned for the same exchange name.
 */
const exchangeTokenCache = new Map<string, Type<Exchange<unknown>>>();

/**
 * Creates a `Type` for an `Exchange` implementation with the specified exchange name.
 *
 * If called multiple times with the same exchangeName, returns the same token instance.
 *
 * @param exchangeName - The name of the exchange.
 * @returns A `Type` for an `Exchange` implementation with the specified exchange name.
 */
export function ExchangeToken<MsgType>(
  exchangeName: string
): Type<Exchange<MsgType>> {
  // Check if we already have a token for this exchangeName
  if (exchangeTokenCache.has(exchangeName)) {
    // Type assertion here because we stored as unknown
    return exchangeTokenCache.get(exchangeName)!;
  }

  // No cached token found, create a new one
  const token = Type<Exchange<MsgType>>(`Exchange<${exchangeName}>`);
  exchangeTokenCache.set(exchangeName, token);
  return token as Type<Exchange<MsgType>>;
}
