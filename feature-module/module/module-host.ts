import type { IModuleBuilder } from "../../mod.ts";

export abstract class AbstractModuleHost {
  /**
   * Produce a module builder (IModuleBuilder) for this module.
   * Typically sets up publishEvents, subscribeToQueue, etc.
   */
  public abstract buildModule(builder: IModuleBuilder): IModuleBuilder;
}

/**
 * Example AiThreadModuleHost which is itself a container-scoped injection
 *
 @Injectable<AiThreadModuleHost>(ModuleBuilderToken)
@Scoped(Scope.Container)
class AiThreadModuleHost extends AbstractModuleHost {
  public buildModule(builder: IModuleBuilder): IModuleBuilder {
    return builder
      .publishEvents("ai-thread", "ai-thread")
      .subscribeToQueue("ai-thread");
  }
}
 * and also depends on a specialized builder from DI or some higher-level service.
 */
