import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/main.ts', 'src/preload.ts', 'src/symbols.ts', 'src/react.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['electron', 'react', 'react/jsx-runtime']
})
