import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const extensions = [".ts", ".tsx", ".js", ".mjs"];
const typescriptExtension = /\.[cm]?tsx?$/i;
const cssModuleSource = `
const styles = new Proxy(Object.create(null), {
  get(_target, property) {
    return typeof property === "string" ? property : undefined;
  },
});

export default styles;
`;

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
    const hasExtension = /\.[a-z0-9]+$/i.test(specifier);

    if (!isRelative || hasExtension) throw error;

    for (const extension of extensions) {
      try {
        return await nextResolve(`${specifier}${extension}`, context);
      } catch {
        // Try the next supported source extension.
      }
    }

    throw error;
  }
}

export async function load(url, context, nextLoad) {
  if (!url.startsWith("file:")) {
    return nextLoad(url, context);
  }

  const fileName = fileURLToPath(url);
  if (fileName.endsWith(".module.css")) {
    return {
      format: "module",
      shortCircuit: true,
      source: cssModuleSource,
    };
  }

  if (!typescriptExtension.test(fileName)) {
    return nextLoad(url, context);
  }

  const source = await readFile(fileName, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      inlineSourceMap: true,
      inlineSources: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
  });

  return {
    format: "module",
    shortCircuit: true,
    source: result.outputText,
  };
}
