import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

/** @type {import('rollup').RollupOptions} */
const option = {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    'fs',
    'path',
    'crypto',
    'process',
    'prismjs/components/',
    'date-fns/format',
  ],
  plugins: [
    json(),
    terser(),
    commonjs(),
    typescript({
      typescript: require('typescript'),
      tsconfigOverride: {
        compilerOptions: { module: 'ESNext' },
      },
    }),
  ],
};

export default option;
