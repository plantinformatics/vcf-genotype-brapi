import * as vcfFeature from './src/utils/data/vcf-feature.js';
import * as vcfGenotype from './src/utils/data/vcf-genotype.js';

/* These functions won't be used in node.js server ATM,
 * They are very close to the synonymous files in src/utils/data/
 * and can be merged, with isomorphic packaging enabling a single source to be
 * used in either the browser or node.js
 *  src/utils/data/nodeJs/germinate-genotype.js
 *  src/utils/data/nodeJs/germinate.js
 */

import * as germinateGenotype from './src/utils/data/germinate-genotype.js';
import * as germinate from './src/utils/data/germinate.js';

export default {vcfFeature, vcfGenotype, germinateGenotype, germinate};
