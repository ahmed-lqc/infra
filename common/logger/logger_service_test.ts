import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { expect } from "@std/expect";
import { createContainer } from "di-wise";
import {
  type ILoggerOptions,
  LoggerConfigToken,
  LoggerServiceToken,
} from "./logger.types.ts";
import { LoggerService } from "./logger-service.ts";

describe("LoggerService (BDD style)", () => {
  let logger: LoggerService;
  let originalConsoleInfo: typeof console.info;
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;
  let originalConsoleDebug: typeof console.debug;

  let infoCalls: unknown[][];
  let errorCalls: unknown[][];
  let warnCalls: unknown[][];
  let debugCalls: unknown[][]; // for both debug and verbose logs

  beforeAll(() => {
    // Setup DI Container and register the mock configuration
    const container = createContainer();
    const config: ILoggerOptions = {
      hideFields: ["password", "token", "secret"],
    };
    container.register(LoggerConfigToken, { useValue: config });
    container.register(LoggerServiceToken, { useClass: LoggerService });

    // Resolve the logger once for all tests
    logger = container.resolve(LoggerServiceToken) as LoggerService;

    // Set initial context and logId
    logger.setContext("test-process", { requestId: "req-123" });
    logger.setLogId("log-789");
  });

  beforeEach(() => {
    // Mock console methods before each test
    originalConsoleInfo = console.info;
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    originalConsoleDebug = console.debug;

    infoCalls = [];
    errorCalls = [];
    warnCalls = [];
    debugCalls = [];

    console.info = (...args: unknown[]) => infoCalls.push(args);
    console.error = (...args: unknown[]) => errorCalls.push(args);
    console.warn = (...args: unknown[]) => warnCalls.push(args);
    console.debug = (...args: unknown[]) => debugCalls.push(args);
  });

  afterEach(() => {
    // Restore the original console methods after each test
    console.info = originalConsoleInfo;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.debug = originalConsoleDebug;
  });

  it("should log info messages and mask sensitive fields", () => {
    const context = {
      body: { password: "secretPass", user: "John" },
    };
    logger.log("User login attempt", context);

    expect(infoCalls.length).toBe(1);
    const [message, meta] = infoCalls[0];
    expect(message).toBe("User login attempt");
    // Password should be masked
    expect((meta as typeof context)?.body?.password).toBe("***");
    // Context should be included
    expect((meta as Record<string, unknown>)?.requestId).toBe("req-123");
    expect((meta as Record<string, unknown>)?.logId).toBe("log-789");
  });

  it("should log error messages and mask tokens", () => {
    logger.error("Invalid token error", { token: "mySecretToken" });

    expect(errorCalls.length).toBe(1);
    const [message, meta] = errorCalls[0];
    expect(message).toBe("Invalid token error");
    // Token should be masked
    expect((meta as Record<string, unknown>)?.token).toBe("***");
    expect((meta as Record<string, unknown>)?.requestId).toBe("req-123");
  });

  it("should log warnings without sensitive fields", () => {
    logger.warn("Warning message", { info: "someInfo" });

    expect(warnCalls.length).toBe(1);
    const [message, meta] = warnCalls[0];
    expect(message).toBe("Warning message");
    // No sensitive field here, should remain as is
    expect((meta as Record<string, unknown>)?.info).toBe("someInfo");
    expect((meta as Record<string, unknown>)?.requestId).toBe("req-123");
  });

  it("should log debug messages with masked fields", () => {
    const context = { body: { password: "anotherSecret" } };
    logger.debug("Debugging issue", context);

    expect(debugCalls.length).toBe(1);
    const [message, meta] = debugCalls[0];
    expect(message).toBe("Debugging issue");
    // Password should be masked
    expect((meta as typeof context)?.body?.password).toBe("***");
    expect((meta as Record<string, unknown>)?.requestId).toBe("req-123");
  });

  it("should log verbose messages and handle query and variables masking", () => {
    // A GraphQL scenario with sensitive field in query and variables
    logger.verbose("Executing GraphQL mutation", {
      query: `mutation { login(token: "abc") }`,
      variables: { token: "abc" },
    });

    expect(debugCalls.length).toBe(1); // verbose logs go to console.debug in this setup
    const [message, meta] = debugCalls[0];
    expect(message).toBe("Executing GraphQL mutation");

    // token should be masked in both query and variables
    const query = (meta as Record<string, unknown>)?.query as string;
    const variables = (meta as Record<string, unknown>)?.variables as Record<
      string,
      unknown
    >;
    expect(query).toMatch(/token: "\*\*\*"/);
    expect(variables.token).toBe("***");
  });

  it("should allow updating context and logId dynamically", () => {
    const context = { body: { secret: "hidden" } };
    // Update context and logId
    logger.setContext("updated-process", context);
    logger.setLogId("log-abc");

    logger.log("Context updated", context);

    expect(infoCalls.length).toBe(1);
    const [message, meta] = infoCalls[0];
    expect(message).toBe("Context updated");
    // secret should be masked
    expect((meta as typeof context)?.body?.secret).toBe("***");
    // Check updated context and logId
    expect((meta as Record<string, unknown>)?.requestId).toBe("req-123");
    expect((meta as Record<string, unknown>)?.logId).toBe("log-abc");
    expect((meta as Record<string, unknown>)?.process).toBe("updated-process");
  });
});
