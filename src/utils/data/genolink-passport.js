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

  // If any selectFields are defined, pass them as query params in the URL.
  if (selectFields.length) {
    url += '?select=' + selectFields.join(',');
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
    return await response.json();
  } catch (error) {
    console.error("Error in getPassportData:", error);
    throw error;
  }
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
  "instituteCode",
  "accessionNumber",
  "institute.fullName",
  "taxonomy.taxonName",
  "cropName",
  "countryOfOrigin.name",
  "lastModifiedDate",
  "acquisitionDate",
  "doi",
  "institute.id",
  "accessionName",
  "institute.owner.name",
  "genus",
  "taxonomy.grinTaxonomySpecies.speciesName",
  "taxonomy.grinTaxonomySpecies.name",
  "crop.name",
  "taxonomy.grinTaxonomySpecies.id",
  "taxonomy.grinTaxonomySpecies.name",
  "uuid",
  "institute.owner.lastModifiedDate",
  "institute.owner.createdDate",
  "aliases",
  "donorName",
  "donorCode",
  "sampStat",
];

//------------------------------------------------------------------------------
