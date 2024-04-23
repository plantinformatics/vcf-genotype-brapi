/* global require */
/* global process */

//--------------------------------------

import express, { json } from 'express';
// console.log('express', express);

import { program } from 'commander';
import bodyParser from 'body-parser';
// console.log('bodyParser', bodyParser);
import cors from 'cors';

//--------------------------------------

import { maps } from './maps.js';
import { allelematrix, allelematrices } from './allelematrix.js';

//------------------------------------------------------------------------------

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
if (options.verbose) {
  console.log('Parsed command-line options:', options);
}
if (options.help) {
  program.help();
}

const PORT = options.apiPort;

//------------------------------------------------------------------------------

const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());
// Enable CORS for all routes
const corsOptions = {
  origin: true,
  credentials: true,
  maxAge: 86400
};
app.use(cors(corsOptions));

//------------------------------------------------------------------------------

// POST endpoint for /api/token
app.post('/api/token', (req, res) => {
  res.json({ token: "Test_Token" });
});

app.get('/api/brapi/v2/maps', maps);

/** Receive GET request from :
 * @solgenomics/brapijs/src/brapi_methods/allelematrices.js
 */
app.get('/api/brapi/v2/allelematrices', allelematrices);

// POST endpoint for /allelematrix
app.post('/allelematrix', allelematrix);

//------------------------------------------------------------------------------

// Start the server
app.listen(PORT, () => {
  if (options.verbose) {
    console.log(`Verbose mode enabled`);
  }
  console.log(`Server is running on port ${options.apiPort}`);
});

//------------------------------------------------------------------------------
