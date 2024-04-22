/* global require */

import express, { json } from 'express';
import { program } from 'commander';
// console.log('express', express);
import bodyParser from 'body-parser';
// console.log('bodyParser', bodyParser);

import { allelematrix } from './allelematrix.js';

program
  .name('node server.mjs')
  .description('Command line options for the server')
  .usage('[options]')
  .option('-h, --help', 'output usage information')
  .option('--version', 'output the version number')
  .option('-v, --verbose', 'output extra debugging')
  .option('-p, --apiPort <port>', 'API port number', '3000')
  .option('--vcfDir <path>', 'Directory path for VCF files')
  .option('--jsonDir <path>', 'Directory path for JSON files')
  .option('--datasetsJson <path>', 'Path to datasets JSON file')
  .parse(process.argv);

program.on('--help', () => {
  console.error('Usage message for invalid command-line arguments');
});

const options = program.opts();
if (options.help) {
  program.help();
}

const PORT = options.apiPort;

const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// POST endpoint for /allelematrix
app.post('/allelematrix', allelematrix);

// Start the server
app.listen(PORT, () => {
    if (options.verbose) {
        console.log(`Verbose mode enabled`);
    }
    console.log(`Server is running on port ${options.apiPort}`);
});
