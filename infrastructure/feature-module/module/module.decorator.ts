import {
  Injectable,
  Scoped,
  Scope,
  type ClassDecorator,
  type Constructor,
  type Token,
} from "di-wise";
import type { AbstractModuleHost } from "./module-host.ts";
import { ModuleHostToken } from "./tokens.ts";

export function ModuleBuilder<T extends AbstractModuleHost>(): ClassDecorator<
  Constructor<T>
> {
  return (klass, context) => {
    Scoped(Scope.Container)(klass, context);
    Injectable<T>(ModuleHostToken as unknown as Token<T>)(klass, context);
  };
}
