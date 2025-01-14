import { Type } from "di-wise";
import type {
  IApplication,
  IApplicationBuilder,
} from "./application.interface.ts";
import type z from "zod";

let ConfigTokenCache: Type<IApplicationBuilder<z.AnyZodObject>> | null = null;
/**
 * A token that represents the `IApplicationBuilder` interface. This can be used for dependency injection to provide an implementation of the `IApplicationBuilder` interface.
 */

export function AppBuilderToken<T extends z.ZodType<unknown>>(): Type<
  IApplicationBuilder<T>
> {
  if (ConfigTokenCache) return ConfigTokenCache as Type<IApplicationBuilder<T>>;
  else {
    ConfigTokenCache = Type<IApplicationBuilder<T>>("AppBuilderToken");
    return ConfigTokenCache as Type<IApplicationBuilder<T>>;
  }
}

export const AppToken: Type<IApplication> = Type<IApplication>("AppToken");
