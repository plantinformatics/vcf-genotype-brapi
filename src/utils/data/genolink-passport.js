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
 * @param {string} baseUrl - The base URL of the API (e.g., "https://genolink.plantinformatics.io").
 * @returns {Promise<any>} - Resolves with the JSON response from the API.
 */
export async function getPassportData({ accessionNumbers = [], genotypeIds = [], selectFields = [] }, baseUrl) {
  let url = new URL("/api/genesys/accession/query", baseUrl);

  const
  /** selectFields === [] means all fields are selected. */
  accessionNumberAdded = selectFields.length && !selectFields.includes("accessionNumber"),
  selectFieldsAN = accessionNumberAdded ? 
    selectFields.concat("accessionNumber") : selectFields;

  // If any selectFields are defined, pass them as query params in the URL.
  if (selectFieldsAN.length) {
    url += '?select=' + selectFieldsAN.join(',');
  }

  // Prepare the request payload. Only include keys that have values.
  const payload = {};
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
    if (!response.ok) {
      throw new Error(`Error fetching passport data: ${response.status} ${response.statusText}`);
    }

    return await response.json()
      .then(data => fillInMissingData(accessionNumbers, genotypeIds, selectFields, selectFieldsAN, accessionNumberAdded, data));
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
function fillInMissingData(accessionNumbers, genotypeIds, selectFields, selectFieldsAN, accessionNumberAdded, data) {
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
  /** From the original response only .content is used; if other parts are
   * needed then it can be copied with :
   *   Object.assign(Object.assign({}, data), {content : parallel})
   */
  return {content : parallel};
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

export const passportFieldNames = [
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
  "taxonomy.grinTaxonomySpecies.name",
  "taxonomy.grinTaxonomySpecies.speciesName",
  "taxonomy.taxonName",
  "uuid",
];

//------------------------------------------------------------------------------
