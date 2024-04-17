import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
{
  input: 'main.mjs',

  external: ['interval-tree-1d', '@solgenomics/brapijs', 'fetch',
    'interval-bins'],
  output: {
    name: 'vcf-genotype-brapi',
    file: 'dist/vcf-genotype-brapi.js',
    format: 'umd',
    globals: {
      'interval-tree-1d': 'createIntervalTree',
      '@solgenomics/brapijs': 'BrAPI',
      'fetch': 'fetch',
      '@plantinformatics/child-process-progressive': 'childProcessProgressive'
    }
  }
},
{
  input: 'main.node.mjs',
  external: [
    '@plantinformatics/child-process-progressive',
    'interval-bins'],

  output: {
    name: 'vcf-genotype-brapi-node',
    file: 'dist/vcf-genotype-brapi-node.mjs',
    format: 'esm',
  },
  plugins: [commonjs(), resolve()]
}

];
