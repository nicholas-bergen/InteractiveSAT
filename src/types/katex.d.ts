declare module "katex" {
  interface KatexOptions {
    displayMode?: boolean;
    throwOnError?: boolean;
  }

  interface KatexApi {
    renderToString(latex: string, options?: KatexOptions): string;
  }

  const katex: KatexApi;
  export default katex;
}
