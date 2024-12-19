import { build, emptyDir } from "@deno/dnt";

await emptyDir("./.npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
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
  package: {
    // package.json properties
    name: "@lqc/infrastructure",
    version: "0.1.0",
    description: "Your package description",
    license: "MIT",
  },
});
