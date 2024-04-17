/* global require */

import express from 'express';
// console.log('express', express);
import bodyParser from 'body-parser';
// console.log('bodyParser', bodyParser);

import { allelematrix } from './allelematrix.js';

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// POST endpoint for /allelematrix
app.post('/allelematrix', allelematrix);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
