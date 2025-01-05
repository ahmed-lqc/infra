import { Type } from "di-wise";
import type { ServerRunner } from "./server-runner.ts";

export const ServerRunnerToken = Type<ServerRunner>("ServerRunnerToken");
