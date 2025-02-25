//------------------------------------------------------------------------------

export { parseStringFields}
/** Handle string representations of boolean and Number args in objects passed as remoteMethod params.  The boolean args are being received as  strings, e.g.
 * vcfGenotypeLookup() : preArgs : {... , requestInfo: 'false', requestFormat: 'Numerical', requestSamplesAll: 'true', snpPolymorphismFilter: 'false'}
 * Parse these to convert to native boolean values true, false.
 *
 * Use this also for numeric values - JSON.parse() works for those also, e.g.
 * Block.blockFeaturesCounts : userOptions : { ... mafThreshold : '0', ... }
 *
 * Originally named parseBooleanFields(), (added in pretzel in 011deb32, minor edit in 339ab17b) in lb4app/lb3app/common/utilities/json-text.js.
 */
function parseStringFields(object, fieldNames) {
  fieldNames.forEach(fieldName => {
    if (typeof object[fieldName] === 'string') {
      /** trace confirmed this is used for : snpPolymorphismFilter,
       * mafThreshold, featureCallRateThreshold in blockFeaturesCounts. */
      // console.log('parseStringFields', fieldName, object[fieldName]);
      object[fieldName] = JSON.parse(object[fieldName]);
    }
  });
}

//------------------------------------------------------------------------------
