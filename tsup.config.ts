import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/main.ts', 'src/preload.ts', 'src/symbols.ts', 'src/react.tsx'],
  format: ['esm', 'cjs'],
  // tsup 8.5.1 injects `baseUrl` into the DTS build; TypeScript 6 treats that as
  // TS5101. Silence until tsup stops injecting it (TS 7 is not compatible yet).
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0'
    }
  },
  clean: true,
  external: ['electron', 'react', 'react/jsx-runtime']
})
