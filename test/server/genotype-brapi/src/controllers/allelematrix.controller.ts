// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';
import { Request, RestBindings, get, response, ResponseObject } from '@loopback/rest';

/**
 * OpenAPI response for allelematrix()
 */
const ALLELE_MATRIX_RESPONSE: ResponseObject = {
  description: 'AlleleMatrix Response',
  content: {
    'application/json': {
      example: {
        "metadata": {
          "status": [{}]
        },
        "result": {
          "callSetDbIds": [
            "Database2§1",
            "Database2§2"
          ],
          // ... other properties from the example response
        }
      }
    },
  },
};



export class AllelematrixController {
  constructor() {}

  // Map to `GET /allelematrix`
  @get('/allelematrix')
  @response(200, ALLELE_MATRIX_RESPONSE)
  allelematrix(): object {
    // This is where you would add the logic to fetch and return the actual data
    // For now, we are returning a static example response
    return ALLELE_MATRIX_RESPONSE?.content?.['application/json']?.example;
  }
}
