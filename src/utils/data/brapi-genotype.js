// import { A as Ember_A } from '@ember/array';
// import { later } from '@ember/runloop';


//------------------------------------------------------------------------------

import { reduceInSeries } from './promises.js';

//------------------------------------------------------------------------------

/**
 * Functions exported by this source file are included in api-server-germinate
 * via BrAPIWrapObj
 * i.e. these functions are executed with :
 * @param this api-server-germinate
 */

//------------------------------------------------------------------------------

let Ember_A, later;
export { setFrameworkFunctions };
function setFrameworkFunctions(functions) {
  Ember_A = functions.Ember_A;
  later = functions.later;
  console.log('setFrameworkFunctions', 'Ember_A', Ember_A, 'later', later);
}

//------------------------------------------------------------------------------

const dLog = console.debug;

const trace = 1;

//------------------------------------------------------------------------------

/** Copied from ./germinate.js
 */
const brapi_v = 'brapi/v2';

//------------------------------------------------------------------------------


/** Functions to get information required for allelematrix request :
 *  .  variantsets
 *  .  references
 *  .  samples
 */


//------------------------------------------------------------------------------

/* Prototype using curl :
  
export serverUrl=https://gigwa.southgreen.fr/gigwa/rest/brapi/v2

--url "$serverUrl/$1"

sendRequest search/variantsets "{}"

sendRequest search/references '{"studyDbIds":["40175046O32a8b377§1"]}'

sendRequest search/samples '{"studyDbIds":["40175046O32a8b377§1"], "pageSize": 10000}'



sendRequest search/allelematrix  >allelematrix.json '{
"sampleDbIds": ["40175046O32a8b377§1","40175046O32a8b377§36"],
"variantSetDbId": "40175046O32a8b377§1§G1",
    "dataMatrixAbbreviations": [
        "GT"
    ]
}'

*/

//------------------------------------------------------------------------------

//------------------------------------------------------------------------------

let dataModel = {};

//------------------------------------------------------------------------------

/** development wrapper which exercises the 4 steps leading to allelematrices
 */
function variantsets_references_samples_allelematrices() {
  const
  fnName = 'variantsets_references_samples_allelematrices',
  promise =
    this.variantsets()
    .then(() => this.references({studyDbIds: ["40175046O32a8b377§1"]}))
    .then(() => this.samples({studyDbIds:["40175046O32a8b377§1"], pageSize: 10000} ))
    .then(() => this.allelematrices({dataset : 'dataset1'}));

//  germinate = this.germinateInstance;

}

function variantsets() {
  const fnName = 'variantsets';
  /** BrAPINode methods return simple_brapi_call() result frayed; its method
   * .all() calls the given callback once when promise ._state.complete
   * resolves.
   */
  const promise = new Promise((resolve, reject) => {
    const
    germinate = this.germinateInstance,
    frayed = germinate.brapi_root
      .variantsets()
      .all((objects) => {
        console.log(fnName, objects);
        dataModel.variantsets = objects;
        this.getDatasetsBrapiGenotype(objects);
        resolve(objects);
      });
    frayed._state.complete.catch(error => reject(error));
  });
  return promise;
}

//------------------------------------------------------------------------------

/** redirects to GET
 * @param studyDbIds  array of string studyDbId
 */
function references_get(studyDbIds) {
  const fnName = 'references';
  const promise = new Promise((resolve, reject) => {
    const
    germinate = this.germinateInstance,
    frayed = germinate.brapi_root
    .search_references({studyDbIds})
    .all(function(objects){
      console.log(fnName, objects);
      dataModel.references = objects;
      resolve(objects);
    });
    frayed._state.complete.catch(error => reject(error));
  });
  return promise;
}

/**
 * @param studyDbIds  array of string studyDbId
 */
function references(studyDbIds) {
  const fnName = 'references';
  const
  endpoint = brapi_v + '/' + 'search/references',
  body =  {studyDbIds},
  promise = this.germinateInstance.fetchEndpoint(endpoint, 'POST', body);
  if (trace) {
    dLog(fnName, 'serverURL', this.host, 'POST', {endpoint, body});
  }
  promise
    .then(response => {
      dLog(fnName, response);
    });

  return promise;
}


//------------------------------------------------------------------------------

/**
 * @param studyDbIds  array of string studyDbId
 */
function samples_old(studyDbIds) {
  const fnName = 'samples';
  const promise = new Promise((resolve, reject) => {
    const
    germinate = this.germinateInstance,
    /** useOld=true to not redirect to GET.  default behavior.
     * but this sends samples-search POST, so use fetchEndpoint() instead
     */
    frayed = germinate.brapi_root
    .search_samples({studyDbIds}, /*behavior*/undefined, /*useOld*/true)
    .all(function(objects){
      console.log(fnName, objects);
      dataModel.samples = objects;
      resolve(objects);
    });
    frayed._state.complete.catch(error => reject(error));
  });
  return promise;
}


/**
 * @param studyDbIds  array of string studyDbId
 * @param promise yielding sampleNames[]
 */
function samples(studyDbIds) {
  const fnName = 'samples';
  const
  endpoint = brapi_v + '/' + 'search/samples',
  body =  {studyDbIds},
  promise = this.germinateInstance.fetchEndpoint(endpoint, 'POST', body);
  if (trace) {
    dLog(fnName, 'serverURL', this.host, 'POST', {endpoint, body});
  }
  const dataP = promise
    .then(response => {
      dLog(fnName, response);
      /* samples array may be large, so possibly .metadata will be required by caller */
      return response?.metadata ? response.result.data : response;
    });
 
  return dataP;
}


//------------------------------------------------------------------------------

function allelematrices(data) {
  const
  fnName = 'allelematrices',
  germinate = this.germinateInstance;
  dLog(fnName, this.name, this.attrs, germinate, germinate.brapi_root, this.__proto__);
  const promise = new Promise((resolve, reject) => {
    const
    frayed = 
    /*
     * function allelematrices(params, behavior)​
     * function allelematrices_search(params, behavior)​
      */
    germinate.brapi_root
      // x .data([data])
      .allelematrices(data)
      .all(function(objects){
        dLog(fnName, objects);
        resolve(objects);
      });
    const promise = frayed._state.complete;
    dLog(fnName, frayed);
    frayed._state.complete.catch(error => reject(error));
  });
  return promise;
}

export { allelematrix }
/**
 * @param queryData
 * {
 *    callSetDbIds, // aka  sampleDbIds,
 *    variantSetDbId,
 *    positionRanges,
 *    dataMatrixAbbreviations: ['GT'],
 * }
 * If both callSetDbIds and sampleDbIds are given, callSetDbIds will be used.
 * @param promise yielding response.result, i.e.
 * { callSetDbIds, dataMatrices, pagination,
 *   sepPhased: "|",
 *   sepUnphased: "/",
 *   unknownString: ".",
 *   variantDbIds: [ ... ]
 *   variantSetDbIds: [ ... ] }
 * or maybe { metadata, result}
 */
function allelematrix(queryData) {
  const fnName = 'allelematrix';
  const
  endpoint = brapi_v + '/' + 'search/allelematrix',
  body = queryData,
  promise = this.germinateInstance.fetchEndpoint(endpoint, 'POST', body);
  if (trace) {
    dLog(fnName, 'serverURL', this.host, 'POST', {endpoint, body});
  }
  const dataP = promise
    .then(response => {
      dLog(fnName, response);
      /* dataMatrix array may be large, so possibly .metadata will be required by caller */
      return response?.metadata ? response.result : response;
    });
 
  return dataP;
}


//------------------------------------------------------------------------------

export {
  variantsets_references_samples_allelematrices,
}
export {
  variantsets,
}
export {
  references,
}
export {
  samples,
}
export {
  allelematrices,
}

//------------------------------------------------------------------------------
//==============================================================================

/** based on api-server-germinate.js : getDatasets() and viewDatasetP()
 */

/** This is used from variantsets(), via BrAPIWrap, and hence is exported. */
export { getDatasetsBrapiGenotype }
/** generate a view dataset for each Germinate dataset, with a block for each
 * linkageGroup.
 */
function getDatasetsBrapiGenotype(variantsets) {
  const
  fnName = 'getDatasetsBrapiGenotype',
  germinate = this.germinateInstance,
  /** @param previousDatasetObj is not used
   * @param dataset name data of one map from germinate /maps result
   */
  datasetLinkageGroupsFn = (previousDatasetObj, dataset) =>
  this.viewDatasetBrapiGenotypeP(this.store, dataset),
  /*
        germinate.linkagegroups(dataset.mapDbId)
          .then(linkageGroups =>
            ... linkageGroups.result.data))
          .catch(error => dLog(fnName, error)),
          */
  datasets = variantsets,
  datasetsP = reduceInSeries(datasets, datasetLinkageGroupsFn);
  return datasetsP;
}

export { viewDatasetBlocksBrapiGenotypeP }
/**
 * @param this api-server-germinate
 */
function viewDatasetBlocksBrapiGenotypeP(dataset) {
  const
  fnName = 'viewDatasetBlocksBrapiGenotypeP',
  apiServers = this.get('apiServers'),
  promise = this.references([dataset.id])
    .then(response => blocksFn.apply(this, [dataset.store, dataset, response.result.data]))
    .then(blocks => {
        apiServers.incrementProperty('datasetsBlocksRefresh');
        apiServers.trigger('receivedDatasets', [dataset]);
    })
    .catch(error => dLog(fnName, error));
}

/** create Block data store objects to wrap the received result chromosomes
 * (references; or for Germinate : linkageGroups).
 * @param store dataset.store
 * @param resultDataset  dataset received via BrAPI result 
 * @param this api-server-germinate
 * @return blocks[] created
 */
function blocksFn(store, dataset, references) {
  const
  fnName = 'blocksFn',
  apiServers = this.get('apiServers'),
  id2Server = apiServers.get('id2Server'),

  blocks = references.map(reference => {
    const
    name = reference.referenceName,
    chrPrefix = dataset._meta.chrPrefix,
    // chrMap = this.chrMapping?.findBy('0', name),
    /*chrMap?.[1] ||*/ 
    scope = chrPrefix ? name.replace(chrPrefix, '') : name,
    _meta = {brapi : {reference}},
    blockAttributes = {
      datasetId : dataset, //.id,
      name, // : scope,
      id : dataset.id + '_' + name,
      scope,
      _meta,
    },
    /** Block object / record */
    block = store.createRecord('block', blockAttributes);
    id2Server[block.get('id')] = this;
    block.set('mapName', name);

    dLog(fnName, name, blockAttributes, dataset.blocks.length);
    /* If we extend the coverage of BrAPI it may be worth splitting functions in
     * this source file into an ember-data adapter and serializer for BrAPI.
     * As per https://api.emberjs.com/ember-data/4.1/classes/Store#store-createrecord-vs-push-vs-pushpayload,
     * this would change from createRecord() to push(), linking via datasetId :
     * dataset.id, and it would not be necessary to do .blocks.pushObject()
     */
    dataset.blocks.pushObject(block);
    return block;
  });
  return blocks;
}

export { viewDatasetBrapiGenotypeP }
/** Create view datasets in store which reference the BrAPI variantsets.
 * @param store this.store
 * @param resultDataset variantset, received via BrAPI /variantsets
 */
function viewDatasetBrapiGenotypeP(store, resultDataset) {
  const fnName = 'viewDatasetBrapiGenotypeP';
  dLog(fnName, store.name, resultDataset);
  const
  apiServers = this.get('apiServers'),
  /** Record the created datasets and blocks in id2Server, as in :
   * services/data/dataset.js : taskGetList() : datasets.forEach()
   */
  id2Server = apiServers.get('id2Server'),
  datasetsBlocks = this.datasetsBlocks || this.set("datasetsBlocks", Ember_A()),

  datasetP = /*Promise.all(blocksP)*/Promise.resolve([]).then(blocks => {
    const
    /** Use .mapName for .id as well as .name, because dataset.id (not
     * .displayName) is used in gtDatasetTabs which doesn't have space for
     * long displayName-s; .id is also displayed in :
     * Datasets to filter, Variant Intervals, ..., datasetsClasses
     */
    name = resultDataset.studyDbId, // variantSetDbId, // mapName,
    datasetAttributes = {
      name,
      id : name, // .replace('§', '_'),
      // type, _meta.type ?
      tags : ['view', 'Genotype', 'BrAPI'], // Germinate
      _meta : {
        displayName : name,
        chrPrefix : 'chr',
        paths : false, germinate : resultDataset},
      // namespace
      blocks
    };
    if (this.parentName) {
      datasetAttributes.parentName = this.parentName;
    } else if (name.match(/test-wheat/i)) {
      datasetAttributes.parentName = "Triticum_aestivum_IWGSC_RefSeq_v1.0";
    }
    const p = store.createRecord('dataset', datasetAttributes);
    return p;
  });
  datasetP.then(dataset => {
    id2Server[dataset.get('id')] = this;
    id2Server[dataset.get('genotypeId')] = this;
    if (! datasetsBlocks.findBy('name', dataset.name)) {
      datasetsBlocks.push(dataset);
      later(() => {
        apiServers.incrementProperty('datasetsBlocksRefresh');
        apiServers.trigger('receivedDatasets', datasetsBlocks);
      });
    }
  });
  return datasetP;
}

//==============================================================================

import { useGerminate } from './germinate-genotype.js';

export { brapiGenotypeSamples };
/** Get the list of samples for datasetId.
 * @return promise yielding samples[]
 */
function brapiGenotypeSamples(datasetId) {
  /** based on extract from germinate-genotype.js : germinateGenotypeSamples(),
   * changed from @param cb to @return promise
   */
  const
  promise =
  /*useGerminate()
    .then(germinate => )*/
  this.samples([datasetId]);
  return promise;
}

export { brapiGenotypeAllelematrix };
/** Get the allelematrix for dataset, positionRanges.
 * @param block of BrAPI dataset
 * Has ._meta.germinate.variantSetDbId
 * block.get('datasetId.samples') is defined - it is used to translate
 * sampleNames to sampleDbIds.
 * @param interval [start, end]
 * @param sampleNames [sampleName, ...]
 * @return promise yielding allelematrix[]
 */
function brapiGenotypeAllelematrix(block, interval, sampleNames) {
  /** based on extract from germinate-genotype.js : germinateGenotypeAllelematrix(),
   * changed from @param cb to @return promise
   */
  const
  dataset = block.get('datasetId'),
  variantSetDbId = dataset.get('_meta.germinate.variantSetDbId'),
  datasetId = dataset.get('id'),
  referenceName = block.get('_meta.brapi.reference.referenceName'),
  /** maybe @param positionRanges [[start, end], ...] */
  positionRanges = Array.isArray(interval) ? referenceName + ':' + interval.join('-') : interval,
  sampleNamesArray = Array.isArray(sampleNames) ? sampleNames : sampleNames.split('\n'),
  /** lookup sampleDbId from sampleName in dataset.samples */
  /** or @param sampleDbIds [sampleDbId, ...] */
  // -  choose dataset.samples[0] if ! sampleNamesArray.length
  samples = dataset.get('samples').filter(sample => sampleNamesArray.includes(sample.sampleName)),
  sampleDbIds = samples.mapBy('sampleDbId'),
  requestData = {
    callSetDbIds: sampleDbIds, // [datasetId],
    variantSetDbId,
    positionRanges : [positionRanges],
    dataMatrixAbbreviations: ['GT'],
  },
  promise =
    this.allelematrix(requestData);
  return promise;
}



//==============================================================================
