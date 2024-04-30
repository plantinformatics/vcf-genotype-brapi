import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';

export default [
{
  input: 'main.mjs',

  external: ['interval-tree-1d', '@solgenomics/brapijs', 'fetch',
    'interval-bins',
    '@ember/array',
    '@ember/runloop'
  ],
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
  },
  plugins: [
    alias({
      entries: [
        { find: 'vcf-genotype-brapi-browser', replacement: 'vcf-genotype-brapi/dist/vcf-genotype-brapi.js' }
      ]
    })
  ]
},
{
  input: 'main.node.mjs',
  external: [
    'util',
    'interval-tree-1d',
    '@plantinformatics/child-process-progressive',	// not effective
    '@plantinformatics/child-process-progressive/dist/child-process-progressive.mjs',
    'interval-bins'],

  output: {
    name: 'vcf-genotype-brapi-node',
    file: 'dist/vcf-genotype-brapi-node.mjs',
    format: 'esm',
  },
  plugins: [commonjs(), resolve()]
}

];
