//------------------------------------------------------------------------------

/** Instead of importing the dependencies apiRequest (which depends on either
 * fetch or node-fetch) and cache (which may be cache-node or cache-browser),
 * which makes this module difficult to package for both browser and Node.js,
 * require the caller to pass those dependencies in via init().
 */

//import { apiRequest } from './api-request.js';
// const { apiRequest } = require('./api-request.js');

// omit .js when building this file in frontend web app
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
export const domainIpk = 'ipk-gatersleben.de';
const baseUrl = 'https://panbarlex.' + domainIpk;

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
// import { CacheWrapper }  from './cache-node.js';
// const { CacheWrapper } = require('./cache-node');
// web-browser
// import { CacheWrapper } from './cache-browser.js';

//------------------------------------------------------------------------------

/** console.debug is now defined also in isNodeJs */
const dLog = console.debug || console.log;

//------------------------------------------------------------------------------

/** There are distinct cache implementations used :
 *  - cache-node.js backend Node.js 
 *  - cache-browser.js frontend browser
 * These have the same signature `CacheWrapper`, so this library can use either
 * via this abstract interface.
 * Packaging both of these for frontend and backend is currently problematic, so
 * instead require the calling app to pass in the implementation to be used.
 *
 * @param {CacheWrapper} cacheWrapper
 */
export function init(cacheWrapper, fetch_) {
  cache = new cacheWrapper('IPK', 'PanBARLEX');
  fetch = fetch_;
}

//------------------------------------------------------------------------------

/** Lookup key in the response cache; if present return it, otherwise fetch(url)
 * and store the response in cache.
 * @param {string} url
 * @param {string} key
 * @return {Promise<string>} response, from cache or API
 */
export function fromCacheOrFetch(url, key) {
  const
  fnName = 'fromCacheOrFetch',
  responseP = cache?.get(key)
    .then(response => {
      // This indicates if cache hit or miss.
      console.log(fnName, key, !!response, response?.length || response?.clusterMembers?.length);
      if (response) {
        return response;
      } else {
        /** promise yielding API response */
        const
        apiP = fetch(url)
          .then(response => response.json())
          .then(response => (cache?.set(key, response), response));
        return apiP;
      }
    });
  return responseP;
}

//------------------------------------------------------------------------------

/** Ids of the gene clusters shown in Known Genes page :
 * https://panbarlex.ipk-gatersleben.de/#known-genes
 * From index.js.
 */
export const clusterIds = [
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
  /** Option to send requests in series instead of parallel, to reduce peak
   * server load. */
  inSeries = true,
  allP = inSeries ? mapInSeries(clusterIds, getGene) :
    Promise.all(clusterIds.map(getGene));

  return allP;
}

  /** Request data for a gene cluster, which includes the projections to
   * reference assemblies.
   *
   * @param {string} clusterId	gene cluster id to request projections for.
   * @return {Promise<Object>}	response data
   */
export async function getGene(clusterId) {
  const fnName = 'getGene';
    /** Usage with reduceInSeries() instead of mapInSeries() is recorded in comments in 0eced61. */
    const
    key = 'sequence_clusters/' + clusterId,
    url = baseUrl + '/' + key;
    let response = await cache?.get(key);
    console.log(fnName, clusterId, !!response, response?.clusterMembers?.length);
    if (! response) {
      /** promise yields response */
      response = await fetch(url)
        .then(response => response.json())
        .then(response => (cache?.set(key, response), response));
    }
    return response;
  }


//------------------------------------------------------------------------------

/** Extract attributes from the response to /sequence_clusters/
 * to be loaded in Pretzel as a Feature.
 * @param {object} gene	result of /sequence_clusters/<clusterId>
 * @return {object} Feature to be pushed to store
 */
export function geneToFeature(gene) {
  const
  fnName = 'geneToFeature',
  {clusterMembers, genes, samples, ...feature} = gene,
  proj = clusterMembers.findBy('sampleId', 'MOREX');
  if (proj.genes.length !== 1) {
    console.log(fnName, proj.genes);
  }
  if (proj.genes.length) {
    const g = proj.genes[0].feature;
    feature.blockId = g.seqid; // blockNames.find(g.seqid);
    feature.value = [g.start, g.end];
    feature._id = g.featureId;
  }
  feature.name = feature.descriptions.join(', '); // clusterId;
  return feature;
}

//------------------------------------------------------------------------------

/** Example of the part of the result of /configuration which is used by getChromosomes()
 */
const configurationExampleResponse = {
  "..." : "...",
  chromosomes: [
    {
      id: 'chr1H',
      label: '1H',
      centromere_position: 206486643,
      start: 121,
      end: 516504168,
      number_of_variants: 16516763
    },
    "..."
  ]
};
/** Get the chromosome names and sizes for referenceAssemblyName.
 * @param {string} referenceAssemblyName	sampleId, e.g. 'Morex'
 * @return {Promise<Array<object>>} promise yielding array of /contig_length/ results
 */
export function getChromosomes(referenceAssemblyName) {
  const
  key = 'configuration',
  requestURL = 'https://divbrowse.' + domainIpk + '/barley_pangenome_v2/' + key,
  chrsP = fromCacheOrFetch(requestURL, key).then(configuration => 
    /** configuration contains [start,end] of 1 assembly, so if
     * referenceAssemblyName matches that then contig_length is not
     * required.  */
    Promise.all(configuration.chromosomes.map(
      chr => getcontig_length(referenceAssemblyName, chr.id) )));
  return chrsP;
}

/** Get contig_length of contigId (chromosome) for referenceAssemblyName.
 * @param {string} referenceAssemblyName	sampleId, e.g. 'Morex'
 * @param {string} contigId	e.g. 'chr6H'
 * @return {Promise<object>} promise yielding a /contig_length/ result
 */
export function getcontig_length(referenceAssemblyName, contigId) {
  const
  queryParameters = {
    sampleId : referenceAssemblyName,
    contigId,
  },
  /** e.g. 'sampleId=Morex&contigId=chr6H' */
  paramsText = Object.entries(queryParameters)
    .map(keyValuePair => keyValuePair.join('='))
    .join('&'),
  key = 'contig_length?' + paramsText,
  requestURL = baseUrl + '/' + key,
  responseP = fromCacheOrFetch(requestURL, key);
  //    {"sampleId":"Morex","contigId":"chr6H","length":561794515}

  return responseP;
}

//------------------------------------------------------------------------------

