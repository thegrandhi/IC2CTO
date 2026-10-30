// The shared ../src/lib/types.ts reads Vite's import.meta.env. The app only imports types
// from it, but tsc still checks the file, so declare the shape here.
interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}
