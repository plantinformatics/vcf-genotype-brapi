//------------------------------------------------------------------------------

const dLog = console.debug;

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
      .all(function(objects){
        console.log(fnName, objects);
        dataModel.variantsets = objects;
        resolve(objects);
      });
    frayed._state.complete.catch(error => reject(error));
  });
  return promise;
}

//------------------------------------------------------------------------------

function references(studyDbIds) {
  const fnName = 'references';
  const promise = new Promise((resolve, reject) => {
    const
    germinate = this.germinateInstance,
    frayed = germinate.brapi_root
    .references({studyDbIds})
    .all(function(objects){
      console.log(fnName, objects);
      dataModel.references = objects;
      resolve(objects);
    });
    frayed._state.complete.catch(error => reject(error));
  });
  return promise;
}

//------------------------------------------------------------------------------

function samples(studyDbIds) {
  const fnName = 'samples';
  const promise = new Promise((resolve, reject) => {
    const
    germinate = this.germinateInstance,
    frayed = germinate.brapi_root
    .samples({studyDbIds})
    .all(function(objects){
      console.log(fnName, objects);
      dataModel.samples = objects;
      resolve(objects);
    });
    frayed._state.complete.catch(error => reject(error));
  });
  return promise;
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
