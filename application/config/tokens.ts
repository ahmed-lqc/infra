import { Type } from "di-wise";
import type { ConfigService } from "./config-service.ts";

/**
 * A cache storing ConfigService tokens keyed by a "configName".
 * This ensures we don't create multiple tokens for the same name.
 */
let configServiceTokenCache: Type<ConfigService<unknown>> | null = null;

/**
 * Returns a unique token for the `ConfigService` type, ensuring that only one token is created per schema type.
 * This token can be used to register and resolve the `ConfigService` in a dependency injection system.
 *
 * @template SchemaType - The schema type for the `ConfigService`.
 * @returns A unique token for the `ConfigService<SchemaType>` type.
 */
export function ConfigServiceToken<SchemaType>(): Type<
  ConfigService<SchemaType>
> {
  if (configServiceTokenCache) {
    return configServiceTokenCache;
  }
  const token = Type<ConfigService<SchemaType>>(`ConfigService>`);
  configServiceTokenCache = token;
  return token;
}
