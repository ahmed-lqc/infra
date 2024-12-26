// @deno-types="@types/lodash-es"
import { cloneDeep } from "lodash-es";
import { inject, Injectable, Scope, Scoped } from "di-wise";
import {
  type ILoggerOptions,
  type ILoggerService,
  LoggerConfigToken,
} from "./logger.types.ts";

@Injectable()
@Scoped(Scope.Inherited)
export class LoggerService implements ILoggerService {
  private config: ILoggerOptions;
  private logId: string = "";
  private processName: string = "";
  private contextMeta: Record<string, unknown> = {};
  private fieldRegexPatterns: Record<
    string,
    { query: RegExp; variable: RegExp }
  > = {};

  constructor() {
    this.config = inject(LoggerConfigToken);
    this.setLogId(crypto.randomUUID());
    this.initializeFieldRegexPatterns();
  }

  setContext(processName: string, context?: Record<string, unknown>): void {
    this.processName = processName;
    this.contextMeta = {
      ...this.contextMeta,
      ...context,
      process: this.processName,
    };
  }

  setLogId(logId: string): void {
    if (logId) {
      this.logId = logId;
      this.contextMeta = {
        ...this.contextMeta,
        logId,
      };
    }
  }

  getLogId(): string {
    return this.logId;
  }

  log(message: string, meta?: Record<string, unknown>): void {
    console.info(message, this.getContext(meta));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(message, this.getContext(meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(message, this.getContext(meta));
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(message, this.getContext(meta));
  }

  verbose(message: string, meta?: Record<string, unknown>): void {
    // verbose logs also go to console.debug
    console.debug(message, this.getContext(meta));
  }

  private getContext(meta?: Record<string, unknown>): Record<string, unknown> {
    const metaClone = cloneDeep(meta);

    if (
      typeof metaClone?.query === "string" &&
      this.isObject(metaClone?.variables)
    ) {
      // GraphQL scenario
      this.hideSensitiveDataInGraphql(
        metaClone as { query: string; variables: Record<string, unknown> },
      );
    } else if (this.isObject(metaClone?.body) && metaClone?.body) {
      // If there's a body, mask fields inside the body
      metaClone.body = this.hideFields(metaClone.body);
    } else if (this.isObject(metaClone)) {
      // For non-body objects, attempt to mask top-level fields too
      this.hideFields(metaClone as Record<string, unknown>);
    }

    return {
      ...this.contextMeta,
      ...(this.isObject(metaClone) ? metaClone : { info: metaClone }),
    };
  }

  private hideFields(obj: Record<string, unknown>): Record<string, unknown> {
    if (this.isObject(obj)) {
      for (const key in obj) {
        if (this.config.hideFields.includes(key)) {
          obj[key] = "***";
        } else if (this.isObject(obj[key])) {
          this.hideFields(obj[key] as Record<string, unknown>);
        }
      }
    }
    return obj;
  }

  private hideSensitiveDataInGraphql(meta: {
    query: string;
    variables: Record<string, unknown>;
  }): void {
    this.config.hideFields.forEach((field) => {
      const patterns = this.fieldRegexPatterns[field];
      if (patterns) {
        meta.query = meta.query.replace(patterns.query, `${field}: "***"`);
        const variablesString = JSON.stringify(meta.variables).replace(
          patterns.variable,
          `"${field}": "***"`,
        );
        meta.variables = JSON.parse(variablesString);
      }
    });
  }

  private initializeFieldRegexPatterns() {
    this.config.hideFields.forEach((field) => {
      this.fieldRegexPatterns[field] = {
        query: new RegExp(`${field}:\\s*".+?"`, "g"),
        variable: new RegExp(`"${field}":\\s*".+?"`, "g"),
      };
    });
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }
}
