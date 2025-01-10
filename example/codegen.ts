import type { CodegenConfig } from "@graphql-codegen/cli";
import * as fs from "node:fs";
import * as path from "node:path";
import { defineConfig } from "@eddeee888/gcg-typescript-resolver-files";

const baseDir = "./apps/ai-assistant/modules";

function findSchemaFilesSync(dir: string): string[] {
  const schemas: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      schemas.push(...findSchemaFilesSync(fullPath));
    } else if (entry.isFile() && entry.name === "schema.graphql") {
      schemas.push(fullPath);
    }
  }
  return schemas;
}

function schemaToGeneratedPath(schemaPath: string): string {
  // Replace `schema.graphql` with `graphql.ts`
  return schemaPath.replace(/schema\.graphql$/, "graphql.ts");
}

const schemas = findSchemaFilesSync(baseDir);

const generates: CodegenConfig["generates"] = {};
for (const schemaPath of schemas) {
  const generatedPath = schemaToGeneratedPath(schemaPath);
  generates[generatedPath] = defineConfig({
    mode: "modules",
    fixObjectTypeResolvers: "smart",
    add: {
      "./types.generated.ts": {
        content: "// deno-lint-ignore-file no-explicit-any ban-types",
      },
    },
    typesPluginsConfig: {
      generateInternalResolversIfNeeded: {
        __resolveReference: true,
      },
      noSchemaStitching: true,
      federation: true,
      useTypeImports: true,
      onlyResolveTypeForInterfaces: true,
      rootValueType: "Record<string, unknown>",
      enumsAsTypes: true,
      immutableTypes: true,
    },
  });
}
const config: CodegenConfig = {
  schema: "**/schema.graphql", // Each schema is defined per file, so not needed globally
  generates,
};

export default config;
