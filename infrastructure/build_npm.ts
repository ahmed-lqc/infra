import { build, emptyDir } from "@deno/dnt";

await emptyDir("./.npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./.npm",
  typeCheck: false,
  test: false,
  skipSourceOutput: true,
  shims: {
    // Deno provides a set of standard shims for Node.js compatibility
    deno: true,
    // You can also include specific shims if needed
    // For example, to include the `node-fetch` shim:
    // custom: [{
    //   package: { name: "node-fetch", version: "^2.6.1" },
    //   globalNames: ["fetch"]
    // }]
  },
  compilerOptions: {
    noUncheckedIndexedAccess: true,
    target: "ES2023",
    // Emit
    stripInternal: true,

    // Language and Environment
    lib: ["ES2022", "ESNext.Decorators", "ESNext"],
    // Completeness
    skipLibCheck: true,
  },
  package: {
    // package.json properties
    name: "@lqc/infrastructure",
    version: "0.1.0",
    description: "Your package description",
    license: "MIT",
    devDependencies: {
      "@types/amqplib": "^0.10.5",
      "@types/lodash-es": "^4.17.12",
    },
  },
  postBuild() {
    Deno.copyFileSync(".npmrc", ".npm/.npmrc");
  },
  importMap: "./deno.json",
});
