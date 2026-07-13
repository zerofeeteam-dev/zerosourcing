const extensions = [".ts", ".tsx", ".js", ".mjs"];

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
