import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';


export default [
{
  input: 'main.mjs',

  external: ['interval-tree-1d', '@solgenomics/brapijs', 'fetch',
    'interval-bins',
    '@ember/array',
    '@ember/runloop',
    'lodash/object.js',
  ],
  output: {
    dir: 'dist', // Changed from 'file' to 'dir'
    format: 'esm',
    entryFileNames: 'vcf-genotype-brapi.js', // Specify the entry file name
    chunkFileNames: '[name]-[hash].js', // Handle chunk file names if applicable
    globals: {
      'interval-tree-1d': 'createIntervalTree',
      '@solgenomics/brapijs': 'BrAPI',
      'fetch': 'fetch',
      '@plantinformatics/child-process-progressive': 'childProcessProgressive',
      'lodash/object.js': 'lodash_object',
    }
  },
  plugins: [
    json(),
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
    'flat-cache',
    '@plantinformatics/child-process-progressive',	// not effective
    '@plantinformatics/child-process-progressive/dist/child-process-progressive.mjs',
    'interval-bins'],

  output: {
    dir: 'dist', // Changed from 'file' to 'dir'
    format: 'esm',
    entryFileNames: 'vcf-genotype-brapi-node.mjs', // Specify the entry file name
  },
  plugins: [commonjs(), resolve(), json(), ]
}

];
