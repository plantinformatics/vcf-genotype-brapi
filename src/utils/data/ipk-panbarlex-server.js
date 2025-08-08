//------------------------------------------------------------------------------

import { apiRequest } from './api-request.js';
// const { apiRequest } = require('./api-request.js');

import { mapInSeries } from './promises.js';
/*
let mapInSeries;
import('@plantinformatics/vcf-genotype-brapi/dist/vcf-genotype-brapi-node.mjs').then(vcfGenotypeBrapi => {
  const promises = vcfGenotypeBrapi.default.promises;
  console.log('vcfGenotypeBrapi', vcfGenotypeBrapi, 'promises', promises);
  mapInSeries = promises.mapInSeries;
});
*/



//------------------------------------------------------------------------------

/** Base of web API endpoint URLs of IPK PanBARLEX
 */
const baseUrl = 'https://panbarlex.ipk-gatersleben.de';

//------------------------------------------------------------------------------


/* global require */	// defined in Node.js server only
/** Distinguish between 2 environments : web-browser frontend or backend (Node.js server)
 * Alternative :  isNodeJs = (typeof process !== 'undefined')
 */
const isNodeJs = typeof window === 'undefined';
/** Import fetch depending on the environment */
// const fetch = isNodeJs ? require('node-fetch') : window.fetch;

let cache;
/*
if (isNodeJs) {
  const { CacheWrapper } = require('./cache-node.js');
  cache = new CacheWrapper();
} else {
  const { CacheWrapper } = await import('./cache-browser.js');
  cache = new CacheWrapper();
}
*/
// Node.js
 import { CacheWrapper }  from './cache-node.js';
// const { CacheWrapper } = require('./cache-node');
// web-browser
// import { CacheWrapper } from './cache-browser.js';

cache = new CacheWrapper('IPK', 'PanBARLEX');

//------------------------------------------------------------------------------

/** Ids of the gene clusters shown in Known Genes page :
 * https://panbarlex.ipk-gatersleben.de/#known-genes
 * From index.js.
 */
const clusterIds = [
  /** duplicates : BarleyCDS90_21807, BarleyCDS90_06263 */
  'BarleyCDS90_26655',
  'BarleyCDS90_11894',
  'BarleyCDS90_28638',
  'BarleyCDS90_21807',
  // 'BarleyCDS90_21807',
  'BarleyCDS90_16242',
  'BarleyCDS90_29093',
  'BarleyCDS90_32122',
  'BarleyCDS90_03650',
  'BarleyCDS90_12108',
  'BarleyCDS90_20032',
  'BarleyCDS90_08746',
  'BarleyCDS90_26304',
  'BarleyCDS90_13218',
  'BarleyCDS90_32282',
  'BarleyCDS90_02101',
  'BarleyCDS90_23360',
  'BarleyCDS90_12730',
  'BarleyCDS90_26113',
  'BarleyCDS90_12265',
  'BarleyCDS90_18400',
  'BarleyCDS90_12590',
  'BarleyCDS90_04005',
  'BarleyCDS90_22416',
  'BarleyCDS90_21767',
  'BarleyCDS90_27197',
  'BarleyCDS90_21150',
  'BarleyCDS90_27024',
  'BarleyCDS90_05674',
  'BarleyCDS90_24106',
  'BarleyCDS90_19421',
  'BarleyCDS90_20558',
  'BarleyCDS90_06263',
  'BarleyCDS90_14810',
  'BarleyCDS90_30630',
  'BarleyCDS90_05066',
  'BarleyCDS90_11183',
  'BarleyCDS90_14602',
  'BarleyCDS90_04855',
  'BarleyCDS90_18169',
  'BarleyCDS90_03514',
  'BarleyCDS90_20637',
  'BarleyCDS90_12606',
  'BarleyCDS90_16788',
  'BarleyCDS90_03661',
  'BarleyCDS90_20867',
  'BarleyCDS90_03660',
  'BarleyCDS90_10622',
  'BarleyCDS90_02817',
  'BarleyCDS90_20076',
  'BarleyCDS90_26502',
  'BarleyCDS90_22983',
  'BarleyCDS90_26445',
  'BarleyCDS90_05119',
  'BarleyCDS90_03849',
  'BarleyCDS90_02298',
  'BarleyCDS90_28839',
  'BarleyCDS90_16461',
  'BarleyCDS90_12637',
  'BarleyCDS90_14064',
  'BarleyCDS90_13238',
  'BarleyCDS90_07253',
  'BarleyCDS90_06263',
  'BarleyCDS90_18064',
  'BarleyCDS90_32523',
  'BarleyCDS90_05952',
  'BarleyCDS90_01082',
  'BarleyCDS90_07326',
  'BarleyCDS90_14480',
  'BarleyCDS90_09159',
  'BarleyCDS90_06461',
  'BarleyCDS90_02227',
  'BarleyCDS90_12379',
  'BarleyCDS90_04098',
  'BarleyCDS90_13747',
  'BarleyCDS90_18436',
  'BarleyCDS90_07497',
  'BarleyCDS90_11112',
  'BarleyCDS90_15689',
  'BarleyCDS90_17088',
  'BarleyCDS90_30284',
  'BarleyCDS90_32261',
  'BarleyCDS90_19260',
  'BarleyCDS90_28657',
  'BarleyCDS90_03727',
  'BarleyCDS90_27400',
  'BarleyCDS90_25598',
  'BarleyCDS90_22388',
  'BarleyCDS90_28381',
  'BarleyCDS90_13798',
  'BarleyCDS90_23167',
  'BarleyCDS90_22569',
  'BarleyCDS90_28347',
  'BarleyCDS90_09215',
  'BarleyCDS90_10442',
  'BarleyCDS90_16674',
  'BarleyCDS90_05804',
  'BarleyCDS90_06164',
  'BarleyCDS90_07756',
  'BarleyCDS90_19605',
  'BarleyCDS90_13788',
  'BarleyCDS90_25906',
  'BarleyCDS90_17853',
];

/** Request data for each of the gene clusters in clusterIds[].
 * @return {Promise<Array>}	promise yielding an array of the responses.
 */
export /*async*/ function getKnownGenes() {
  const
  fnName = 'getKnownGenes',
  responses = [],

  /** Request data for a gene cluster, which includes the projections to
   * reference assemblies.
   *
   * Changed from using reduceInSeries() to mapInSeries() because the latter is
   * simpler for this case, and will drop the reduceInSeries() comments after commit.
   * reduceInSeries() passes this additional parameter previousClusterResponse:
   * @param  {Object} previousClusterResponse result of promise which has just resolved,
   * i.e. response for previous clusterId in array.
   * @param {string} clusterId	gene cluster id to request projections for.
   * @return {Promise<Object>}	response data
   */
  getOneP = async (/*previousClusterResponse,*/ clusterId) => {
    /** for reduceInSeries(), there is no previous value in the first call, i.e. i=0.
    if (previousClusterResponse) {
      responses.push(previousClusterResponse);
    }
    */
    const
    key = 'sequence_clusters/' + clusterId,
    url = baseUrl + '/' + key;
    let response = await cache?.get(key);
    console.log(fnName, clusterId, !!response, response?.clusterMembers?.length);
    if (! response) {
      /** promise yields response */
      response = await apiRequest(url)
        .then(response => (cache?.set(key, response), response));
    }
    return response;
  },
  /*lastP = reduceInSeries(clusterIds, getOneP),
  allP = lastP.then(response => (responses.push(response), responses));*/
  allP = mapInSeries(clusterIds, getOneP);
  return allP;
}

//------------------------------------------------------------------------------
