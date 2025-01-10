import { createContainer } from "di-wise";
import { LoggerConfigToken, LoggerServiceToken } from "./logger.types.ts";
import { LoggerService } from "./logger-service.ts";

export default function loggerModule(
  parentContainer: ReturnType<typeof createContainer>,
  hideFields?: string[],
) {
  const container = createContainer({ parent: parentContainer });

  // Provide the logger configuration, including hide fields
  container.register(LoggerConfigToken, {
    useValue: {
      hideFields: [
        "password",
        "token",
        "access_token",
        "secret",
        ...(hideFields ?? []),
      ],
    },
  });

  // Register the logger service implementation
  container.register(LoggerServiceToken, { useClass: LoggerService });
}
