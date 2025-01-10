import { Type } from "di-wise";
import type {
  IApplication,
  IApplicationBuilder,
} from "./application.interface.ts";

/**
 * A token that represents the `IApplicationBuilder` interface. This can be used for dependency injection to provide an implementation of the `IApplicationBuilder` interface.
 */
export const AppBuilderToken: Type<IApplicationBuilder> =
  Type<IApplicationBuilder>("AppBuilderToken");

export const AppToken: Type<IApplication> = Type<IApplication>("AppToken");
