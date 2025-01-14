import { Type } from "di-wise";
import type { IAiThreadService } from "./ai-thread-service.type.ts";

export const AiThreadServiceToken = Type<IAiThreadService>("AiThreadService");
