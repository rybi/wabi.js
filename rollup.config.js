import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

export default [
  // UMD build (minified)
  {
    input: "src/index.js",
    output: {
      file: "dist/wabi.min.js",
      format: "umd",
      name: "wabi",
      exports: "named",
    },
    plugins: [resolve(), terser()],
  },
  // ES module build
  {
    input: "src/index.js",
    output: {
      file: "dist/wabi.esm.js",
      format: "es",
    },
    plugins: [resolve()],
  },
  // CommonJS build
  {
    input: "src/index.js",
    output: {
      file: "dist/wabi.cjs.js",
      format: "cjs",
      exports: "named",
    },
    plugins: [resolve()],
  },
];
