
//------------------------------------------------------------------------------

/*
import * as childProcess from '@plantinformatics/child-process-progressive/dist/child-process-progressive.mjs';
console.log('childProcess', childProcess);
import vcfGenotypeBrapi from '@plantinformatics/vcf-genotype-brapi/dist/vcf-genotype-brapi-node.mjs';
console.log('vcfGenotypeBrapi', vcfGenotypeBrapi);
*/

//------------------------------------------------------------------------------


/** from test_position-ranges.response.json */
const test_position_ranges_response =
{
    "metadata": {
        "status": [
            {}
        ]
    },
    "result": {
        "callSetDbIds": [
            "Database2§1",
            "Database2§2"
        ],
        "dataMatrices": [
            {
                "dataMatrix": [
                    [
                        "0",
                        "0"
                    ],
                    [
                        "0",
                        "0"
                    ],
                    [
                        "0",
                        "0"
                    ],
                    [
                        "1",
                        "1"
                    ]
                ],
                "dataMatrixAbbreviation": "GT",
                "dataMatrixName": "Genotype",
                "dataType": "string"
            }
        ],
        "pagination": [
            {
                "dimension": "VARIANTS",
                "page": 0,
                "pageSize": 1000,
                "totalCount": 4,
                "totalPages": 1
            },
            {
                "dimension": "CALLSETS",
                "page": 0,
                "pageSize": 1000,
                "totalCount": 2,
                "totalPages": 1
            }
        ],
        "sepPhased": "|",
        "sepUnphased": "/",
        "unknownString": ".",
        "variantDbIds": [
            "Database2§scaffold38755_1207866",
            "Database2§scaffold38755_1235130",
            "Database2§scaffold89939_1420884",
            "Database2§scaffold89939_1421208"
        ],
        "variantSetDbIds": [
            "Database2§1§run1"
        ]
    }
};

//------------------------------------------------------------------------------

export { allelematrix }
function allelematrix(req, res) {
  // Extract data from the request body
  const { callSetDbIds, variantSetDbId, positionRanges, dataMatrixAbbreviations } = req.body;

  console.log('Received data:', req.body);

  // Mock response data
  const data = test_position_ranges_response;
  const responseData = {
    message: "Allele Matrix Data Retrieved Successfully",
    data
  };

  // Send the response back to the client
  res.json(responseData);
};

//------------------------------------------------------------------------------

