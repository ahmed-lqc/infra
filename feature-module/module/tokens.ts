import { Type } from "di-wise";
import type { IModuleBuilder } from "./feature_module.interfaces.ts";
import type { AbstractModuleHost } from "./module-host.ts";

// For all module hosts
export const ModuleHostToken: Type<AbstractModuleHost> = Type<
  AbstractModuleHost
>("ModuleHostToken");

// For a module builder
export const ModuleBuilderToken: Type<IModuleBuilder> = Type<IModuleBuilder>(
  "ModuleBuilderToken",
);
