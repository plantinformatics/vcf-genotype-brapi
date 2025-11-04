import { chunk } from 'lodash/array.js';

// import { mapInSeries } from './promises'; // .js

//------------------------------------------------------------------------------

/* global URL */

//------------------------------------------------------------------------------
const dLog = console.debug;
//------------------------------------------------------------------------------

/** Genolink API default page length, i.e. this is the default value used if API
 * query parameter &p= is not provided in the request URL
 */
export const pageLengthDefault = 100;

/** In the passport data rows there are 2 name / identity fields :
 * .  accessionNumber
 * .  genotypeID
 * The equivalent POST data fields of the /query endpoint are named :
 * . accessionNumbers
 * . genotypeIds
 * The same names are used for passing as parameters to getPassportData{,Chunk}().
 *
 * This object provides a mapping to rename from the field names to the parameter 
 */
export const fieldName2ParamName = {
  genotypeID: 'genotypeIds',
  accessionNumber : 'accessionNumbers'
};

//------------------------------------------------------------------------------

/* This class provides a mapping required from field names listed in
 * passportFieldNames (many with '.') to the field names in /query body,  e.g.
 * - crop.name -> crop
 * - instituteCode -> institute : { code 
 * - acquisitionDate ? -> createdDate
 * - countryOfOrigin.name -> countryOfOrigin : { code3
 * - genus -> taxonomy: { genus
 *
 * As other filters are added, the following will need to preserve those
 * not being changed.
 */
export class PassportFilter {
  static className = 'PassportFilter';

  get empty() {
    const
    values = Object.values(this),
    /** filter values are arrays, apart from createdDate */
    empty =
      (values.length === 0) ||
      ! values.find(v =>
        (Array.isArray(v) && v.length) ||
          ((typeof v === 'object') && Object.keys(v).length));
    return empty;
  }

  /** Set up a filter if required (i.e. value is not empty);
   * update the filter if already created.
   * @param container	object to hold 'filter' property : new PassportFilter()
   * @param key	id of filterable field, i.e. member of passportFieldNamesFilterable[]
   * @param value	array of strings to search for
   */
  static update(container, key, value) {
    let filter = container.filter;
    if (value?.length && ! filter) {
      filter = container.filter = new PassportFilter();
    }
    if (filter) {
      filter[key] = value;
    }
  }

  /** unused draft, includes removing `this` when it is .empty(),
   * which is not done, but may be considered.
   */
  set_(key, value) {
    if (key === 'crop.name') {
      if (value?.length) {
        this.currentSearch.filter = {crop : value};
      } else {
        delete this.currentSearch.filter;
      }
    }
  }
  /** Translate the filters defined in `this` to the form required in API
   * endpoint /query body.
   */
  get body() {
    const
    fnName = 'body',
    body = Object.entries(this).reduce((b, [key, value]) => {
      switch (key) {

      case 'crop.name' :
        if (value?.length) {
          b.crop = value.map(crop => cropPretzel2Genesys[crop] || crop);
        }
        break;

      case 'instituteCode' :
        if (value?.length) {
          b.institute = {code : value};
        }
        break;

      case 'countryOfOrigin.name' :
        if (value?.length) {
          b.countryOfOrigin = {code3 : value};
        }
        break;

      case 'genus' :
        if (value?.length) {
          b.taxonomy = {genus : value};
        }
        break;

      default:
        dLog(PassportFilter.className, fnName, 'key', key, 'not implemented');
        break;
      }
      return b;
    }, {});
    dLog(PassportFilter.className, fnName, body, this, JSON.stringify(body), JSON.stringify(this));
    return body;
  }

}

// currentSearch.changeCount
// this.currentSearch

//------------------------------------------------------------------------------

/**
 * @file genolink-passport.js
 * 
 * Provides functions to access the Passport Data Retrieval API from Genesys.
 * This API endpoint allows users to retrieve passport data using either a list of 
 * accession numbers, genotype IDs, or both.
 */

/**
 * @typedef {Object} PassportDataQuery
 * @property {Array<string>} [accessionNumbers] - An array of accession numbers.
 * @property {Array<string>} [genotypeIds] - An array of genotype IDs.
 * @property {<string>} _text - A text string to search for.
 * @property {Array<string>} [selectFields] - An array of Passport data field names; possible values are in passportFieldNames[].
 */

/**
 * Fetch passport data from the Genesys API.
 *
 * Update : some of the given accessionNumbers or genotypeIds may not be present
 * in database. These will be omitted from the response.
 * To handle this :
 *
 * - "accessionNumber" should be added to selectFields if not present, to enable
 *  the Genolink backend to map accessions to their corresponding genotype IDs.
 *  It should be filtered out of the output if it was not present in
 *  selectFields.
 *
 * - genotypeID is added to the output, and should be filtered out of the output
 *
 * - for genotypeIds (or accessionNumbers) which are not in the output, add an
 *   object with an empty string for each of selectFields.
 *
 * There is an example of this in the header comment of the following function,
 * which performs those output filtering steps, @see fillInMissingData().
 *
 * Looking at the 2 uses of this function :
 * - datasetGetPassportData() (manage-genotype.js) does not require filter
 *   "accessionNumber" and "genotypeID" to be filtered out of the output.
 * - selectedSamplesGetPassport() (genotype-samples.js) will output those fields
 *   if they are not filtered out, but in some cases including genotypeID may be
 *   desired.
 *
 * @param {PassportDataQuery} query - Query parameters.
 * @param {Array<string>} [query.accessionNumbers] - An array of accession numbers.
 * @param {Array<string>} [query.genotypeIds] - An array of genotype IDs.
 * @param {Array<string>} [query.selectFields] - An array of Passport data field names.
 * If not provided, the default is to request all passport data, i.e. all fields.
 * @param {string} query._text	optional text string to search for.
 * If provided, then neither of {accessionNumbers, genotypeIds} are required.
 * @param {string} query.filter	optional filter such as {"crop": ["groundnuts", "lentil"]}
 * @param {string} query.filterCode from previous response, can be used to get
 * further pages with the same query parameters.
 * @param {number} query.page	optional, only used if _text
 * @param {number} query.pageLength	optional, default pageLengthDefault.
 *
 * @param {string} baseUrl - The base URL of the API (e.g., "https://genolink.plantinformatics.io").
 * @returns {Promise<any>} - Resolves with the JSON response from the API.
 * Update : {Array<Promise<any>>}
 */
export function getPassportData(
  {accessionNumbers = [], genotypeIds = [], selectFields = [], _text, filter,
   filterCode, page, pageLength = pageLengthDefault }, baseUrl) {
  /** default page size of Genolink
   * By using (<=) pageLengthDefault, it is not necessary to use &p= &l=
   */
  const
  accessionNumbersIsKey = accessionNumbers.length > 0,
  keyName = accessionNumbersIsKey ? 'accessionNumbers' : 'genotypeIds',
  keys = accessionNumbersIsKey ? accessionNumbers : genotypeIds,
  chunks = chunk(keys, pageLength),
  elt2PromiseFn = (keyschunk, i) => getPassportDataChunk({[keyName] : keyschunk, selectFields}, baseUrl, i, pageLength),
  /** array of promises; just 1 if ! chunks.length. */
  response = chunks.length ?
    chunks.map(elt2PromiseFn) :
    [getPassportDataChunk(
      {_text, filter, filterCode, selectFields}, baseUrl, page, pageLength)];
  // or mapInSeries(keys, elt2PromiseFn)

  // caller e.g. : [].concat(responses);

  return response;
}
export async function getPassportDataChunk(
  { accessionNumbers = [], genotypeIds = [], selectFields = [], _text, filter, filterCode },
  baseUrl, page, pageLength) {

  let url = new URL("/api/genesys/accession/query", baseUrl);

  const
  fnName = 'getPassportDataChunk',
  /** selectFields === [] means all fields are selected. */
  accessionNumberAdded = selectFields.length && !selectFields.includes("accessionNumber"),
  selectFieldsAN = accessionNumberAdded ? 
    selectFields.concat("accessionNumber") : selectFields;

  const queryParams = [];
  const payload = {};
  // If any selectFields are defined, pass them as query params in the URL.
  // encodeURIComponent() is not needed because field names are alphabetic [A-Za-z.].
  if (selectFieldsAN.length) {
    queryParams.push('select=' + selectFieldsAN.join(','));
  }
  /* Page params could be used if the full list of keys were sent in each
   * request, but the list of keys is chunked into separate requests.
   * They are relevant for search, e.g.  body search filters such as _text, and filterCode, 
   // + '&p=' + page + '&l=' + pageLength;
   */
  // maybe : ! (accessionNumbers.length || genotypeIds.length) &&
  if (page ?? false) {
    queryParams.push('p=' + page);
  }
  if (filterCode ?? false) {
    queryParams.push('f=' + filterCode);
  } else {
  if (_text ?? false) {
    payload._text = _text;
  }
  if (filter ?? false) {
    Object.assign(payload, filter);
  }
  }
  // pageLength is not passed if it is the default (pageLengthDefault).
  if ((pageLength ?? false) && (pageLength !== pageLengthDefault)) {
    queryParams.push('l=' + pageLength);
  }
  url += '?' + queryParams.join('&');

  // Prepare the request payload. Only include keys that have values.
  if (accessionNumbers.length > 0) {
    payload.accessionNumbers = accessionNumbers;
  }
  if (genotypeIds.length > 0) {
    payload.genotypeIds = genotypeIds;
  }

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  };

  try {
    const response = await fetch(url.toString(), options);
    dLog(fnName, response.ok, response.json, response);
    if (!response.ok) {
      throw new Error(`Error fetching passport data: ${response.status} ${response.statusText}`);
    }
    return await response.json()
      .then(data => fillInMissingData(accessionNumbers, genotypeIds, _text, selectFields, selectFieldsAN, accessionNumberAdded, data));
  } catch (error) {
    console.error("Error in getPassportData:", error.message, url, payload, error);
    throw error;
  }
}

/** Filter the output of getPassportData(), to fill in missing data.
 *
 * The first 3 parameters are the same as getPassportData().
 * @param {Array<string>} accessionNumbers - An array of accession numbers.
 * @param {Array<string>} genotypeIds - An array of genotype IDs.
 * @param {Array<string>} selectFields - An array of Passport data field names.
 * If not provided, the default is to request all passport data, i.e. all fields.
 *
 * @param {Array<string>} selectFields - An array of Passport data field names.
 * This is the same as selectFields if selectFields includes or implies "accessionNumber";
 * otherwise it is a copy of selectFields, with "accessionNumber" appended.
 *
 * @param {object} data	response from API request.
 *
 * ---
 * Example :

selectFields : [ "accessionNumber", "countryOfOrigin.codeNum" ]

input :
```json
{
  "genotypeIds": ["AGG240WHEA2-B00003-1-09", "AGG5259WHEA1-B00003-1-06",
  "AGG_missing_data_ID"]
}
```

API response:
```json
{
    "content": [
        {
            "accessionNumber": "AGG 240 WHEA",
            "countryOfOrigin.codeNum": "380",
            "genotypeID": "AGG240WHEA2-B00003-1-09"
        },
        {
            "accessionNumber": "AGG 5259 WHEA",
            "countryOfOrigin.codeNum": "364",
            "genotypeID": "AGG5259WHEA1-B00003-1-06"
        }
    ],
}
```

desired output : 
```json
[
        {
            "accessionNumber": "AGG 240 WHEA",
            "countryOfOrigin.codeNum": "380"
        },
        {
            "accessionNumber": "AGG 5259 WHEA",
            "countryOfOrigin.codeNum": "364"
        },
        {
            "accessionNumber": "",
            "countryOfOrigin.codeNum": ""
        },
    ],

 */
function fillInMissingData(accessionNumbers, genotypeIds, _text, selectFields, selectFieldsAN, accessionNumberAdded, data) {
  if (_text && ! accessionNumbers?.length && ! genotypeIds.length) {
    accessionNumbers = data.content.mapBy('accessionNumber');
  }
  // set up test case
  // genotypeIds.push("missingDataKeyId");
  const
  fnName = 'fillInMissingData',
  /** One of accessionNumbers and genotypeIds is [], and the other is an array
   * of ID strings.
   * Notice that the capitalisation of the query 'genotypeIds' is different to the
   * field name in the response 'genotypeID'.
   */
  keyName = accessionNumbers?.length ? "accessionNumber" : "genotypeID",
  /** Convert the output data.content[] to a map to enable it to be converted to
   * a parallel array.
   */
  map = data.content.reduce((m, d) => {
    const
    key = d[keyName],
    /** As commented in getPassportData(), filtering out "genotypeID",
     * "accessionNumber" may not be required.
     */
    filterOut = false,
    {genotypeID, accessionNumber, ...rest} = d;
    m[key] = filterOut ? rest : d;
    if (filterOut && ! accessionNumberAdded) {
      rest.accessionNumber = accessionNumber;
    }
    return m;
  }, {}),
  keys = accessionNumbers?.length ? accessionNumbers : genotypeIds,
  /** If a key does not have a response, create an empty response with a field
   * for each of selectFields. */
  parallel = keys.map(key =>
    map[key] ||
      Object.fromEntries(selectFields.map(s => [s, '']))  );
  /*
  console.log(
    fnName, accessionNumbers, genotypeIds, selectFields,
    accessionNumberAdded, data, keyName, map, keys, parallel);
    */
  /** Originally (until 33e2d223) just the .content of the response was used.
   * Now returning the whole response to enable .filterCode to be accessed by
   * loadPage().
   * Modify the .content order - use parallel.
   */
  data = Object.assign(Object.assign({}, data), {content : parallel});
  return data;
}

/**
 * Convenience function to query passport data using only accession numbers.
 *
 * @param {Array<string>} accessionNumbers - An array of accession numbers.
 * @param {string} baseUrl - The base URL of the API.
 * @returns {Promise<any>} - Resolves with the JSON response from the API.
 */
export async function getPassportDataByAccessionNumbers(accessionNumbers, baseUrl) {
  return getPassportData({ accessionNumbers }, baseUrl);
}

/**
 * Convenience function to query passport data using only genotype IDs.
 *
 * @param {Array<string>} genotypeIds - An array of genotype IDs.
 * @param {string} baseUrl - The base URL of the API.
 * @returns {Promise<any>} - Resolves with the JSON response from the API.
 */
export async function getPassportDataByGenotypeIds(genotypeIds, baseUrl) {
  return getPassportData({ genotypeIds }, baseUrl);
}

// Example usage:
// (async () => {
//   const baseUrl = "https://genolink.plantinformatics.io";
  
//   // Using genotypeIds only
//   try {
//     const resultByGenotype = await getPassportDataByGenotypeIds(
//       ["AGG240WHEA2-B00003-1-09", "AGG5259WHEA1-B00003-1-06"],
//       baseUrl
//     );
//     console.log("Result by genotype IDs:", resultByGenotype);
//   } catch (err) {
//     console.error(err);
//   }
  
//   // Using accessionNumbers only
//   try {
//     const resultByAccession = await getPassportDataByAccessionNumbers(
//       ["AGG 1 WHEA", "AGG 480 WHEA"],
//       baseUrl
//     );
//     console.log("Result by accession numbers:", resultByAccession);
//   } catch (err) {
//     console.error(err);
//   }
  
//   // Using both
//   try {
//     const resultByBoth = await getPassportData(
//       {
//         accessionNumbers: ["AGG 1 WHEA", "AGG 480 WHEA"],
//         genotypeIds: ["AGG240WHEA2-B00003-1-09"]
//       },
//       baseUrl
//     );
//     console.log("Result using both fields:", resultByBoth);
//   } catch (err) {
//     console.error(err);
//   }
// })();

//------------------------------------------------------------------------------

/** Genolink data fields
 * These cannot be searched with /query?_text=
 */
export const genolinkFieldNames = [
  "genotypeID",
  "region",
  "subRegion",
];

/** Names of Genolink / Genesys Passport data fields.
 * These values are used in the genolink request :
 *   /api/genesys/accession/query?select=...
 */
export const passportFieldNames = [
  // Genolink data fields
  // These cannot be searched with /query?_text=
  "region",
  "subRegion",
  // "status",

  // Genesys passport data fields
  "accessionName",
  "accessionNumber",
  "acquisitionDate",
  "aliases",
  "countryOfOrigin.name",
  "crop.name",
  "cropName",
  "doi",
  "donorCode",
  "donorName",
  "genus",
  "instituteCode",
  "institute.fullName",
  "institute.id",
  "institute.owner.createdDate",
  "institute.owner.lastModifiedDate",
  "institute.owner.name",
  "lastModifiedDate",
  "sampStat",
  "taxonomy.grinTaxonomySpecies.id",
  "taxonomy.grinTaxonomySpecies.name",
  "taxonomy.grinTaxonomySpecies.speciesName",
  "taxonomy.taxonName",
  "uuid",
];

/** A subset of passportFieldNames[], listing just those fields whose values are
 * expected to be in a small set which will fit reasonably in a pull-down <select>.
 */
export const passportFieldNamesCategory = [
  "region",
  "subRegion",

  "countryOfOrigin.name",
  "crop.name",
  "cropName",

  "genus",

  "instituteCode",
];

/** Fields which can be provided as filters in the body of /query API endpoint.
 * This is currently just category fields, i.e. a subset of
 * passportFieldNamesCategory, which is a subset of passportFieldNames.
 * createdDate is not a category field, and may be filtered by a date range {ge, le}.
 */
export const passportFieldNamesFilterable = [
  'crop.name',
  'instituteCode',
  'countryOfOrigin.name',
  'genus',
  // createdDate
];


export const cropPretzel2Genesys = {
  "Barley" : "barley",
  "Chickpea" : "chickpea",
  "Field Pea" : "pea",
  "Lentil" : "lentil",
  "Wheat" : "wheat",
};



//------------------------------------------------------------------------------

/**
 * Translate accessionNumbers to genotypeIds via a request to the Genesys API.
 *
 * @param {Array<string>} accessionNumbers - An array of accession numbers.
 * @returns {Promise<any>} - Resolves with the JSON response from the API.
 * ---
 * @desc
 *
 * Note that in the response the Sample field is the genotypeId.
 *
 * Example :
 * . input parameter : accessionNumbers : ["AGG 37829 WHEA"]
 * . API response:
```json
{
    "Samples": [
        {
            "Accession": "AGG 37829 WHEA",
            "Sample": "AGG37829WHEA2-B00004-7-48"
        }
    ]
}
```

 */
export async function accessionNumbers2genotypeIds(accessionNumbers, baseUrl) {
  let url = new URL("/api/internalApi/mapAccessionToGenotypeId", baseUrl);
  const
  fnName = 'accessionNumbers2genotypeIds',
  payload = {};

  // Prepare the request payload. Only include keys that have values.
  if (accessionNumbers.length > 0) {
    payload.Accessions = accessionNumbers;
  }

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  };

  try {
    const response = await fetch(url.toString(), options);
    dLog(fnName, response.ok, response.json, response);
    if (!response.ok) {
      if (response.status === 404) {
        /* All of accessionNumbers have no genotypeID.
         * They can be filtered out of subsequent calls to accessionNumbers2genotypeIds().
         */
        dLog(fnName, response.status, accessionNumbers);
        return {Samples : []};
      } else {
        throw new Error(`Error in ${fnName}: ${response.status} ${response.statusText}`);
      }
    }
    return await response.json();
  } catch (error) {
    console.error('Error in ', fnName, error.message, url, payload, error);
    throw error;
  }
}



//--------------------------------------------------------------------------------


/** Result of missingCells(), passed to requestMissingCells().
 * Used to collate ids which have missing data for the same field names and
 * can be requested together.
 * This is the value type of requestCache; the key is this.key(this.missingFields).
 */
export class FieldsRows {
  constructor(missingFields) {
    this.missingFields = missingFields;
    this.ids = [];
  }
  /** @return a text key to group ids by the fields which they require data for. */
  static key(missingFields) {
    return missingFields.sort().join(',');
  }
  /** @return a text string to identify a request by its parameters,
   * enabling duplicate requests to be detected. */
  get requestKey() {
    const
    /** .ids.length is expected to be 500 - 10000, and the order may be consistent,
     * so .ids.sort() may not enhance performance. */
    text = FieldsRows.key(this.missingFields) + ':' + this.ids.length + '_' +
      this.ids/*.sort()*/.join(',');
    return text;
  }
}


/** Scan rows for missing cells.
 * @param rows	tableData
 * @param {Array<string>} [selectFields] - An array of Passport data field names for which data is required.
 * @return [key] => {missingFields, ids : []}
 * where key is a text form of missingFields (sorted to recognise uniqueness, for grouping),
 * missingFields is an array of string field names,
 * and ids is an array of string genotypeIDs which are missing those fields.
 */
export function missingCells(rows, selectFields) {
  const
  fnName = 'missingCells',
  /** Determine the missing fields on each row, and for each unique group of
   * missing fields, collate the list of samples / accessions / genotypeIDs
   * which are missing that group of field names.
   * {Array{missingFields, ids}} field name groups, and the rows in which that
   * group is missing. */
  missing = rows.reduce(
    (result, row) => {
      const
      /** missing fields in row */
      missingFields = selectFields.filter(f => !row[f] || row[f] === '_');
      if (missingFields.length)
      {
        const
        key = FieldsRows.key(missingFields),
        request = result[key] || (result[key] = new FieldsRows(missingFields));
        request.ids.push(row.genotypeID);
      };
      return result;
    },
    {});
  return missing;
}
/** Request Passport data for the given rows and field names.
 * The request will redisplay the table, showing the received values.
 * This may be called a number of times in a short interval, so use
 * requestCache to detect if a request is already sent.
 * @param {object} requestCache	cache of promises of requests sent, to handle repeated calls.
 * @param {object} missing	result of .missingCells(), mapping FieldsRows.key() to FieldsRows.
 * @param {function} getNamedRows	(ids, fieldNames) -> promise
 * @return {Array<Promise|undefined>} promises	where each promise is :
 * - undefined if no request is sent, i.e. there is already a
 * current request for these parameters.
 * - otherwise a promise yielding the result of datasetGetPassportData().
 */
export function requestMissingCells(requestCache, missing, getNamedRows) {
  const
  fnName = 'requestMissingCells',
  promises = Object.values(missing).map(m => {
    let promise;
    const
    {missingFields, ids} = m,
    key = m.requestKey;
    dLog(fnName, FieldsRows.key(missingFields), ids, !!requestCache[key]);
    if (! requestCache[key]) {
      promise = requestCache[key] = getNamedRows(ids, missingFields);
      promise.finally(() => delete requestCache[key]);
    }
    return promise;
  });
  return promises;
}


//------------------------------------------------------------------------------
