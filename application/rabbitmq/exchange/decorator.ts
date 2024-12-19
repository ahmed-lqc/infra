import { type ClassFieldDecorator, Inject } from "di-wise";
import { type Exchange, ExchangeToken } from "./exchange.tokens.ts";

/**
 * A decorator function that injects an RabbitMQ exchange instance into a class field.
 *
 * @param exchangeName - The name of the RabbitMQ exchange to be injected.
 * @returns A decorator function that can be applied to a class field.
 */
export function InjectExchange<MsgType>(exchangeName: string) {
  const token = ExchangeToken(exchangeName);
  return Inject(token) as ClassFieldDecorator<Exchange<MsgType>>;
}
