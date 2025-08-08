//------------------------------------------------------------------------------

import * as vcfFeature from './src/utils/data/vcf-feature.js';

//------------------------------------------------------------------------------

/* These functions won't be used in node.js server ATM,
 * They are very close to the synonymous files in src/utils/data/
 * and can be merged, with isomorphic packaging enabling a single source to be
 * used in either the browser or node.js
 *  src/utils/data/nodeJs/germinate-genotype.js
 *  src/utils/data/nodeJs/germinate.js
 */

//------------------------------------------------------------------------------

import * as genolinkPassport  from './src/utils/data/genolink-passport.js';

/* ipkPanbarlex works in both Node.js and web-browser; the dotplot is used in
 * the frontend, but the other functions are only used ATM in the backend, and
 * making them available in the browser entails flat-cache CJS / ESM complications.
 * so ipk-panbarlex.js is split into ipk-panbarlex-browser.js and ipk-panbarlex-server.js.
 */
import * as ipkPanbarlexBrowser from './src/utils/data/ipk-panbarlex-browser.js';
import * as brapiGenotype     from './src/utils/data/brapi-genotype.js';
import * as germinateGenotype from './src/utils/data/germinate-genotype.js';
import * as germinate         from './src/utils/data/germinate.js';
/* Alternately use either browser : bluebird, or node : util */
import * as promisify         from './src/utils/data/promisify.js';

/* As noted above re ipkPanbarlex, apiRequest is only used in Node.js, so
 * comment this out to avoid problems with api-request.js importing node-fetch.
import * as apiRequest        from './src/utils/data/api-request.js'
*/
import * as cacheBrowser      from './src/utils/data/cache-browser.js';
export default {
  vcfFeature, genolinkPassport, ipkPanbarlexBrowser, brapiGenotype, germinateGenotype,
  germinate, promisify,
  /*apiRequest,*/ cacheBrowser,
};

//------------------------------------------------------------------------------
