import { pick } from 'lodash/object.js';

// import { get as Ember_get, set as Ember_set } from '@ember/object';
/*
function Ember_get(object, fieldName) { return object[fieldName]; }
function Ember_set(object, fieldName, value) { object[fieldName] = value; }
*/
let Ember_get, Ember_set;
export { setFrameworkFunctions };
function setFrameworkFunctions(functions) {
  Ember_get = functions.Ember_get;
  Ember_set = functions.Ember_set;
  console.log('setFrameworkFunctions', 'Ember_get', Ember_get, 'Ember_set', Ember_set);
}


//------------------------------------------------------------------------------

const dLog = console.debug;

const trace = 1;


//------------------------------------------------------------------------------

/** number of columns in the vcf output before the first sample column. */
const nColumnsBeforeSamples = 9;

/** Copied from components/panel/manage-genotype.js */
const callRateSymbol = Symbol.for('callRate');

//------------------------------------------------------------------------------

/** map from vcf column name to Feature field name.
 */
const vcfColumn2Feature = {
  'CHROM' : 'blockId',
  'POS' : 'value',
  'ID' : '_name',
  'REF' : 'values.ref',
  'ALT' : 'values.alt',
};

//------------------------------------------------------------------------------

/** Map the column name '(null)' to 'INFO'
 *
 * Using --format %INFO outputs the whole of the INFO value; with the column
 * header name '(null)'
 * (when using e.g. %INFO/MAF, the column header name is the sub-field name, i.e. 'MAF')
 */
function columnNameINFOFix(columnNames) {
  columnNames = columnNames.map(name => name == '(null)' ? 'INFO' : name);
  return columnNames;
}

//------------------------------------------------------------------------------

/**
 * @return true if value is 0, 1, 2, or 0/0, 0/1, 1/0, 1/1,
 * @param value is defined, and is a string
 * It is assumed to be well-formed - only the first char is checked.
 */
function gtValueIsNumeric(value) {
  const char = value[0];
  return ['0', '1', '2'].includes(char);
}

//------------------------------------------------------------------------------

/** Convert punctuation in datasetId to underscore, to sanitize it and enable
 * use of the result as a CSS class name.
 *
 * Used in genotype table column headers for the dataset colour rectangle (border-left).
 * This is in support of selecting dataset colour using datasetId instead of
 * hard-wiring it onto every element; this will support future plans for user
 * editing of dataset colour.
 */
function datasetId2Class(datasetId) {
  const className = datasetId.replaceAll(/[ -,.-/:-?\[-^`{-~]/g, '_');
  return className;
}

// -----------------------------------------------------------------------------

/** If block is Germinate and block._meta.linkageGroupName is defined, insert
 * linkageGroupName into requestOptions, for use with URL path parameter /chromosome/
 * by utils/data/germinate.js : callsetsCalls(), via 
 * germinate-genotype.js :  germinateGenotypeLookup()
 */
function addGerminateOptions(requestOptions, block) {
  if (block?.hasTag('Germinate') && block._meta?.linkageGroupName) {
    requestOptions.linkageGroupName = block._meta.linkageGroupName;
  }
  return requestOptions;
}

//------------------------------------------------------------------------------

/** Request featuresCounts (histograms) for all blocks (chromosomes) of the
 * given dataset.
 * @param auth  service for sending API requests
 * @param datasetId
 * @param genotypeSNPFilters  current user-controlled thresholds for SNP filters
 * controls.genotypeSNPFilters
 */
function getDatasetFeaturesCounts(auth, datasetId, genotypeSNPFilters) {
  const promise = auth.getDatasetFeaturesCounts(datasetId, genotypeSNPFilters);
  return promise;
}

//------------------------------------------------------------------------------

/** Lookup the genotype for the selected samples in the interval of the brushed block.
 * The server store to add the features to is derived from
 * vcfGenotypeLookupDataset() param blockV, from brushedOrViewedVCFBlocksVisible,
 * which matches vcfDatasetId : scope
 * @param auth  auth service for ajax
 * @param samples to request, may be undefined or []
 * Not used if requestSamplesAll
 * @param domainInteger  [start,end] of interval, where start and end are integer values
 * @param requestOptions :
 * {requestFormat, requestSamplesAll, headerOnly},
 * . requestFormat 'CATG' (%TGT) or 'Numerical' (%GT for 01)
 * . headerOnly true means -h (--header-only), otherwise -H (--no-header)
 * . linkageGroupName defined if isGerminate
 *
 * @param vcfDatasetId  id of VCF dataset to lookup
 * @param scope chromosome, e.g. 1A, or chr1A - match %CHROM chromosome in .vcf.gz file
 * @param rowLimit
 */
function vcfGenotypeLookup(auth, samples, domainInteger, requestOptions, vcfDatasetId, scope, rowLimit) {
  const
  fnName = 'vcfGenotypeLookup',

  region = scope + ':' + domainInteger.join('-'),
  requestFormat = requestOptions.requestFormat,
  /** this dataset has tSNP in INFO field */
  requestInfo = requestFormat && (vcfDatasetId === 'Triticum_aestivum_IWGSC_RefSeq_v1.0_vcf_data'),
  preArgs = Object.assign({
    region, samples, requestInfo
  }, requestOptions);
  /** Noted in vcfGenotypeLookup.bash : When requestOptions.isecDatasetIds is given,
   * -R is used, so -r is not given, i.e. preArgs.region is not used.
   */
  // parent is .referenceDatasetName


  /* reply time is generally too quick to see the non-zero count, so to see the
   * count in operation use +2 here. */
  auth.apiStatsCount(fnName, +1);

  /** Currently passing datasetId as param 'parent', until requirements evolve.
   * The VCF dataset directories are just a single level in $vcfDir;
   * it may be desirable to interpose a parent level, e.g. 
   * vcf/
   *   Triticum_aestivum_IWGSC_RefSeq_v1.0/
   *     Triticum_aestivum_IWGSC_RefSeq_v1.0_vcf_data
   * It's not necessary because datasetId is unique.
   * (also the directory name could be e.g.  lookupDatasetId ._meta.vcfFilename instead of the default datasetId).
   */
  const
  textP = auth.vcfGenotypeLookup(vcfDatasetId, scope, preArgs, rowLimit, {} )
    .then(
      (textObj) => {
        /* Result from Pretzel API endpoint is vcfGenotypeLookup is {text};
         * result from Germinate is an array, recognised by vcf-feature.js : resultIsGerminate(). */
        const text = textObj.text || textObj;
        auth.apiStatsCount(fnName, -1);
        return text;
      });
  return textP;
}


//------------------------------------------------------------------------------


/* sample data :

 * -------------------------------------
 * default output format :

##fileformat=VCFv4.1
##FILTER=<ID=PASS,Description="All filters passed">
##phasing=none
##INFO=<ID=NS,Number=1,Type=Integer,Description="Number of Samples With Data">

##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype as 0/1">

#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	ExomeCapture-DAS5-003227	ExomeCapture-DAS5-002775	ExomeCapture-DAS5-002986
chr1A	327382120	scaffold22435_31704476	G	A	100	PASS	AC=3;AN=6;NS=616;MAF=0.418019;AC_Het=233;tSNP=.;pass=no;passRelaxed=no;selected=no	GT:GL:DP	1/0:-7.65918,-2.74391e-08,-7.48455:6	1/0:-5.41078,-0.00397816,-2.1981:3	1/0:-4.50477,-1.46346e-05,-10.5809:6

 * -------------------------------------
 * requestFormat === 'CATG' : formatArgs = '-H  -f "%ID\t%POS[\t%TGT]\n"' :

# [1]ID	[2]POS	[3]ExomeCapture-DAS5-002978:GT	[4]ExomeCapture-DAS5-003024:GT	[5]ExomeCapture-DAS5-003047:GT	[6]ExomeC
scaffold38755_709316	709316	C/C	C/T	C/C	C/C	C/C	./.	C/C	C/C	C/C	C/T	C/C	C/C	C/C	C/C	C/T	C/C	C/C	C/C	C/C	C/T	C/C	C/C	C

 * -------------------------------------
 * requestFormat === 'Numerical' : formatArgs = '-H  -f "%ID\t%POS[\t%GT]\n"' :

# [1]ID	[2]POS	[3]ExomeCapture-DAS5-002978:GT	[4]ExomeCapture-DAS5-003024:GT	[5]ExomeCapture-DAS5-003047:GT	[6]ExomeC
scaffold38755_709316	709316	0/0	0/1	0/0	0/0	0/0	./.	0/0	0/0	0/0	0/1	0/0	0/0	0/0	0/0	0/1	0/0	0/0	0/0	0/0	0/1	0/0	0/0	0


*/




/** Parse VCF output and add features to block.
 * @return
 *  { createdFeatures : array of created Features,
 *    sampleNames : array of sample names }
 *
 * @param block view dataset block for corresponding scope (chromosome)
 * @param requestFormat 'CATG', 'Numerical', ...
 * @param replaceResults  true means remove previous results for this block from block.features[] and selectedFeatures.
 * @param selectedService if defined then update selectedFeatures
 * @param text result from bcftools request
 */
function addFeaturesJson(block, requestFormat, replaceResults, selectedService, text) {
  const fnName = 'addFeaturesJson';
  dLog(fnName, block.id, block.mapName, text.length);
  /** optional : add fileformat, FILTER, phasing, INFO, FORMAT to block meta
   * read #CHROM or '# [1]ID' column headers as feature field names
   * parse /^[^#]/ (chr) lines into features, add to block
   */
  let
  createdFeatures = [],
  /** if the output is truncated by rowLimit aka nLines, the last line will not
   * have a trailing \n, and is discarded.  If incomplete lines were not
   * discarded, values.length may be < 4, and feature.value may be undefined.
   */
  lines = text.split('\n'),
  meta = {},
  /** true if column is genotype format value. */
  columnIsGT,
  columnNames,
  sampleNames,
  nFeatures = 0;
  dLog(fnName, lines.length);
  if (text && text.length && (text.charAt(text.length-1) !== '\n')) {
    dLog(fnName, 'discarding incomplete last line', lines[lines.length-1]);
    lines.splice(-1, 1);
  }

  if (replaceResults) {
    if (selectedService) {
      const selectedFeatures = selectedService.selectedFeatures;
      // let mapChrName = Ember_get(block, 'brushName');
      /* remove features of block from createdFeatures, i.e. matching Chromosome : mapChrName
       * If the user has renewed the axis brush, then selectedFeatures will not
       * contain any features from selectionFeature in previous result; in that
       * case this has no effect and none is required.
       * If the user send a new request with e.g. changed samples, then this would apply.
       * This can also be moved to selectedService.
       */
      let blockSelectedFeatures = selectedFeatures.filter((f) => f.feature.get('blockId.id') === block.id);
      if (blockSelectedFeatures.length) {
        selectedFeatures.removeObjects(blockSelectedFeatures);
      }
    }

    if (block.get('features.length')) {
      // alternative : block.set('features', Ember_A());
      block.features.removeAt(0, block.get('features.length'));
    }
  }
  if (selectedService) {
    selectedService.selectedFeaturesUpdateIndex();
  }


  lines.forEach((l, lineNum) => {
    if (l.startsWith('##')) {
      const nameVal = l.match(/^##([^=]+)=(.*)/);
      if (nameVal.length > 2) {
        /** ##INFO and ##FORMAT are duplicated : could .match(/.*ID=(.+),(.+)>/) and use ID to store [2] in meta.{INFO,FORMAT}.<ID>
         * ##bcftools_{viewVersion,viewCommand} are also duplicated, the last pair generated this output so it is of more interest.
         */
        meta[nameVal[1]] = nameVal[2];
      }
    } else if (l.startsWith('#CHROM')) {
      // Column header row output by bcftools view
      columnNames = l.slice(1).split('\t');
      columnNames = columnNameINFOFix(columnNames);
      sampleNames = columnNames.slice(nColumnsBeforeSamples);
      // from columnNames.slice(0,9), appended tSNP.
      const nonSampleFields = ['CHROM', 'POS', 'ID', 'REF', 'ALT', 'QUAL', 'FILTER', 'INFO', 'FORMAT', 'tSNP'];
      columnIsGT = columnNames.map(c => nonSampleFields.includes(c));
    } else if (l.startsWith('# [1]ID') || l.startsWith('#[1]ID')) {
      // Column header row output by bcftools query
      // # [1]ID	[2]POS	[3]ExomeCapture-DAS5-002978:GT	[4]ExomeCapture-DAS5-003024:GT	[5]ExomeCapture-DAS5-003047:GT	[6]ExomeC
      /* between versions 1.9 and 1.19 of bcftools, this changed '# [1]ID' to '#[1]ID'
       * 1.9 is current on centos (2024Jan).
       */
      columnIsGT = l
        .split(/\t\[[0-9]+\]/)
        .map((name) => name.endsWith(':GT'));
      // trim off :GT, and split at 'tab[num]'
      columnNames = l
        .replaceAll(':GT', '')
        .split(/\t\[[0-9]+\]/);
      columnNames[0] = columnNames[0].replace(/^# ?\[1\]/, '');
      columnNames = columnNameINFOFix(columnNames);
      // nColumnsBeforeSamples is 2 in this case : skip ID, POS.
      sampleNames = columnNames.slice(2);
      // skip the (null) / INFO column name
      sampleNames.splice(2, 1);
    } else if (columnNames && l.length) {
      const values = l.split('\t');

      let feature = values.reduce((f, value, i) => {
        const fieldName = columnNames[i];

        let fieldNameF;
        /* vcfColumn2Feature[] provides Feature field name corresponding to the
         * column name, for the common columns; for other cases this is
         * overridden in the switch default.
         */
        fieldNameF = vcfColumn2Feature[fieldName];
        /** maybe handle samples differently, e.g. Feature.values.samples: []
         * if (i > nColumnsBeforeSamples) { ... } else
         */
        switch (fieldName) {
        case 'CHROM' :
          let scope = value.replace(/^chr/, '');
          if (scope !== block.scope) {
            dLog(fnName, value, scope, block.scope, fieldName, i);
            value = null;
          } else {
            value = block;
          }
          break;

        case 'POS' :
          value = parseNumber(value);
          f['value_0'] = value;
          value = [ value ];
          break;

        case 'ID' :
        case 'REF' :
        case 'ALT' :
          break;

        case 'INFO' : // (null)
          fieldNameF = 'values.' + fieldName;
          const infoEntries = value.split(';').map(kv => kv.split('='));
          value = Object.fromEntries(infoEntries);

          if (value.MAF) {
            value.MAF = parseNumber(value.MAF);
          }
          if (value.tSNP) {
            if ((value.tSNP === '.') || (value.tSNP === '')) {
              delete value.tSNP;
            } else {
              value.tSNP = parseNumber(value.tSNP);
            }
          }
          parseNumberFields(value);

          break;

        default :
          fieldNameF = 'values.' + fieldName;
          value = parseNumber(value);
        }
        if (! fieldNameF) {
          dLog(fnName, fieldName, value, i);
        } else {
          /** match values. and meta.  */
          let prefix = fieldNameF.match(/^([^.]+)\..*/);
          prefix = prefix && prefix[1];
          if (prefix) {
            /** replace A/A with A, 1/1 with 2 (i.e. x/y -> x+y). */
            if (columnIsGT[i]) {
              let match = value.match(/^(\w)[|/](\w)$/);
              if (! match) {
              } else if (requestFormat === 'Numerical') {
                // +"0" + "0" is "00", so the + + is required.
                value = '' + (+match[1] + +match[2]);
              } else /* CATG */
              if (match[1] === match[2]) {
                value = match[1];
              }
            }
            if (! f[prefix]) {
              f[prefix] = {};
            }
            if (fieldName.match(/\./)) {
              // Ember_set() interprets dot in field name, so use [] =
              f[prefix][fieldName] = value;
            } else {
              /* could also use Ember_set() when ! prefix. */
              Ember_set(f, fieldNameF, value);
            }

            /* These will not be needed after changing references to e.g.
             * feature.values.MAF to feature.values.INFO.MAF, which is
             * equivalent and replaces it. */
            if (value.MAF) {
              f.values.MAF = value.MAF;
            }
            if (value.tSNP) {
              f.values.tSNP = value.tSNP;
            }

          } else {
            f[fieldNameF] = value;
          }
        }
        return f;
      }, {});
      // or EmberObject.create({value : []});

      /* CHROM column is present in default format, and omitted when -f is used
       * i.e. 'CATG', 'Numerical', so in this case set .blockId here. */
      if (requestFormat) {
        feature.blockId = block;
      }

      /** based on similar : components/table-brushed.js : afterPaste()  */

      /** If it is required for vcfFeatures2MatrixView() to create displayData
       * without creating model:Feature in the Ember data store, the following
       * part can factor out as a separate function, returning an array of
       * native JS objects at this point, and passing those to the 2nd function
       * for creation of model:Feature
       */
      if (feature.blockId && feature.value?.length && feature._name) {
        // trace level is e.g. 0,1,2,3; the number of rows displayed will be e.g. 0,2,4,8.
        if (trace && (lineNum < (1 << trace))) {
          dLog(fnName, 'newFeature', feature);
        }

        // in this case feature.blockId is block
        let store = feature.blockId.get('store');

        /** name is used in CSS selector, e.g. in utils/draw/axis.js :
         * axisFeatureCircles_selectOne{,InAxis}(), and . and : are not valid
         * for that use. */
        const separator = '_';
        if (feature._name === '.') {
          // Use chr:position:ref:alt, with separator in place of ':'
          feature._name = block.name + separator + feature.value[0];
          ['ref', 'alt'].forEach(a => {
            const value = feature.values[a];
            if (value) {
              feature._name += separator + value;
            }
          });
        }
        if (feature._name) {
          feature._name = datasetId2Class(feature._name);
        }

        // .id is used by axisFeatureCircles_eltId().
        // ._name may be also added to other blocks.
        /* append .value[0] to handle datasets with duplicate .name in 1 chr
         * This could be optional - done just when
         *  (existingFeature.get('value.0') !== feature.value[0])
         */
        feature.id = block.id + '_' + feature._name + '_' + feature.value[0];
        feature.id = feature.id.replace('.', '_');
        let existingFeature = store.peekRecord('feature', feature.id);
        if (existingFeature) {
          mergeFeatureValues(existingFeature, feature);
          feature = existingFeature;
          // this is included in createdFeatures, since it is a result from the current request.
        } else {
          // Replace Ember.Object() with models/feature.
          feature = store.createRecord('feature', feature);
          /** fb is a Proxy */
          let fb = feature.get('blockId');
          if (fb.then) {
            fb.then((b) => feature.set('blockId', b));
          }
        }
        nFeatures++;

        let mapChrName = Ember_get(feature, 'blockId.brushName');
        if (selectedService) {
          selectedService.selectedFeaturesMergeFeature(mapChrName, feature);
        }

        /* vcfFeatures2MatrixView() uses createdFeatures to populate
         * displayData; it could be renamed to resultFeatures; the
         * feature is added to createdFeatures regardless of
         * existingFeature.
         */
        createdFeatures.push(feature);
        // If existingFeature then addObject(feature) is a no-op.
        if (replaceResults || ! existingFeature) {
          block.features.addObject(feature);
        }
      }

    }
  });
  blockEnsureFeatureCount(block);
  block.addFeaturePositions(createdFeatures);


  if (! columnNames || ! sampleNames) {
    dLog(fnName, lines.length, text.length);
  }

  let result = {createdFeatures, sampleNames};
  return result;
}

//------------------------------------------------------------------------------

/** If block.featureCount is undefined, then it can be set from block.features.length.
 * This is used when features are added from genotype calls received from VCF or Germinate.
 * The features received are likely only a small part of the chromosome, so the
 * count is just a lower bound.  Also it is likely that block.featureCount will
 * be defined from received blockFeaturesCounts; this is just a fall-back.
 * (possibly the first vcf result may arrive before blockFeaturesCounts if
 * blocks are viewed from URL)
 */
function blockEnsureFeatureCount(block) {
  const featuresLength = block.get('features.length');
  if ((block.get('featureCount') ?? 0) < featuresLength) {
    block.set('featureCount', featuresLength);
  }
}

// -----------------------------------------------------------------------------

/** Merge feature.values into existingFeature.values
 */
function mergeFeatureValues(existingFeature, feature) {
  Object.entries(feature.values).forEach((e) => {
    if (existingFeature.values[e[0]] !== e[1]) {
      if (trace > 2) {
        dLog(feature.id, existingFeature.values[e[0]] ? 'setting' : 'adding', e);
      }
      existingFeature.values[e[0]] = e[1];
    }
  });
}

//------------------------------------------------------------------------------

/** @return true if the genotypeLookup API result is from Germinate,
 * false if VCF, from bcftools
 */
function resultIsGerminate(data) {
  return Array.isArray(data);
}

/** Parse Germinate genotype calls result and add features to block.
 * @return
 *  { createdFeatures : array of created Features,
 *    sampleNames : array of sample names }
 *
 * @param block view dataset block for corresponding scope (chromosome)
 * @param requestFormat 'CATG', 'Numerical', ...
 * Unlike bcftools, Germinate probably sends results only in CATG (nucleotide)
 * format, which is the format it uses for upload and storage in HDF.
 * @param replaceResults  true means remove previous results for this block from block.features[] and selectedFeatures.
 * @param selectedService if defined then update selectedFeatures
 * @param data result from Germinate callsets/<datasetDbId>/calls request
 * @param options { nSamples }
 */
function addFeaturesGerminate(block, requestFormat, replaceResults, selectedService, data, options) {
  const fnName = 'addFeaturesGerminate';
  dLog(fnName, block.id, block.mapName, data.length);

  if (replaceResults) {
    dLog(fnName, 'replaceResults not implemented');
  }
  if (false)
  if ((options.nSamples !== undefined) && (data.length > options.nSamples)) {
    dLog(fnName, 'truncate data', data.length, options.nSamples);
    data = data.slice(0, options.nSamples);
  }

  const
  store = block.get('store'),
  columnNames = data.mapBy('callSetName').uniq(),
  sampleNames = columnNames,
  createdFeatures = data.map((call, i) => {
    const f = {values : {}};
    /* Will lookup f.value in block.features interval tree,
     * and if found, merge with existing feature - factor out use of
     * mergeFeatureValues() in addFeaturesJson().
     * Using createdFeatures.push(feature) instead of =data.map()
     */
    // call.callSetDbId identifies sample name : callSetName
    // previously seeing in results : 'CnullT' - this is now fixed in java.
    const genotypeValue = call.genotypeValue;
    f.values[call.callSetName] = genotypeValue;
    let
    {markerName, positionText} = variantNameSplit(call.variantName, i < 5),
    position = +positionText;
    if (isNaN(position)) {
      // handle Oct19 format :  dbid_mapid_ exome SNP name e.g. 6_20_6_scaffold77480, or?  scaffold72661_85293-85293.0
      markerName = positionText;
    } else {
      f.value_0 = position;
      f.value = [position];
    }

    let feature = f;
    /** sampleID corresponds to callSetName, so exclude it from the feature name/id */
    const [datasetID, sampleID] = call.callSetDbId.split('-');
    /* .id is unique per genotype table row;  for 1 feature per cell, append : + '_' + call.callSetName */
    feature._name = markerName;
    feature.id =
      block.id + '_' + datasetID + '_' + markerName;

    feature = featureMergeOrCreate(store, block, feature);

    return feature;
  });

  dLog(fnName, data.length, columnNames.length);

  featureUpdateSelectedAndBlock(selectedService, block, createdFeatures);

  let result = {createdFeatures, sampleNames};
  return result;
}

function featureMergeOrCreate(store, block, feature) {
  /** used in addFeaturesGerminate() and addFeaturesBrapi() */
  let existingFeature = store.peekRecord('feature', feature.id);
  if (existingFeature) {
    mergeFeatureValues(existingFeature, feature);
    feature = existingFeature;
    // this is included in createdFeatures, since it is a result from the current request.
    // as noted in addFeaturesJson(), can rename to resultFeatures.
  } else {
    // addFeaturesJson() uses feature.blockId - not sure if that is applicable
    feature.blockId = block;
    // Replace Ember.Object() with models/feature.
    feature = store.createRecord('feature', feature);
    const server = block.server;
    if (! feature.value) {
      brapiGetVariantPosition(server, feature);
    }
  }
  return feature;
}

function featureUpdateSelectedAndBlock(selectedService, block, createdFeatures) {
  /** used in addFeaturesGerminate() and addFeaturesBrapi() */
  if (selectedService) {
    const
    feature = createdFeatures[0],
    mapChrName = feature?.get('blockId.brushName');
    // selectedService = feature?.get('blockId.axis.selected');
    selectedService.selectedFeaturesUpdateIndex();
    createdFeatures.forEach(
      feature => selectedService.selectedFeaturesMergeFeature(mapChrName, feature));
  }
  // createRecord() connects to block OK, so this is not required :
  // createdFeatures.forEach(feature => {
    // block.features.addObject(feature);

  blockEnsureFeatureCount(block);
  block.addFeaturePositions(createdFeatures);
}

//------------------------------------------------------------------------------

/** Split the variantName from either Germinate or Spark server into component elements.
 * @param variantName
 * @param traceUnmatched  enable tracing of failure to parse variantName
 * @return {markerName, positionText}
 */
function variantNameSplit(variantName, traceUnmatched) {
  const fnName = 'variantNameSplit';
  /** Germinate :
   * "variantName": "m2-23.0" 
   * m2-23.0 => m2 is marker name and 23.0 is its position
   * Some of the marker names contain '-', e.g. 'scaffold77480-1_24233-24233.0'
   * so instead of split('-'), use .match(/(.+) ... ) which is greedy.
   *
   * Spark server : e.g. "variantName":"Chr1A_4188418"
   */
  let match, wholeString, markerName, positionText;
  if ((match = variantName.match(/(.+)-(.+)/))) {
    // Germinate
    [wholeString, markerName, positionText] = match;
  } else if ((match = variantName.match(/(.+)_(.+)/))) {
    // Spark server
    let chrName;
    [wholeString, chrName, positionText] = match;
    // markerName is used to make feature .id and ._name unique
    markerName = positionText;
  } else if (traceUnmatched) {
    dLog(fnName, variantName, 'not matched');
  }
  return {markerName, positionText};
}

//------------------------------------------------------------------------------

export { resultIsBrapi }
/** @return true if the genotypeLookup API result is from Brapi,
 * false if VCF, from bcftools, or Germinate.
 * Related : resultIsGerminate().
 */
function resultIsBrapi(data) {
  return typeof data === 'object';
}

export { addFeaturesBrapi }
/** Parse Brapi genotype calls result and add features to block.
 * Params are the same as addFeaturesGerminate(), except for data.
 * @return
 *  { createdFeatures : array of created Features,
 *    sampleNames : array of sample names }
 * @param requestFormat 'CATG', 'Numerical', ...
 * Not used; BrAPI "GT" returns Numerical format.
 * refn : dataMatrixAbbreviations and dataMatrixNames	in https://brapigenotyping21.docs.apiary.io/#/reference/allele-matrix/get-allelematrix
 * @param data result from BrAPI allelematrix request
 *  {callSetDbIds, dataMatrices, variantDbIds, ... }
 */
function addFeaturesBrapi(block, requestFormat, replaceResults, selectedService, data, options) {
  const fnName = 'addFeaturesBrapi';
  dLog(fnName, block.id, block.mapName, data.callSetDbIds?.length,
       data.variantDbIds?.length, data.dataMatrices?.length);
  if (replaceResults) {
    dLog(fnName, 'replaceResults not implemented');
  }

  const
  store = block.get('store'),
  columnNames = data.callSetDbIds,
  sampleNames = columnNames,
  dataset = block.get('datasetId'),
  samples = dataset.get('samples'),
  samplesById = Object.fromEntries(samples.map(s => [s.sampleDbId, s])),

  createdFeatures = data.variantDbIds.map((variantDbId, variantIndex) => {
    const
    /** only .dataMatrices[0] is handled; [0] should be the data type requested
     * by .dataMatrixAbbreviations / dataMatrixNames, and this function will
     * request 'GT'.
     */
    row = data.dataMatrices[0].dataMatrix[variantIndex],
    entries = data.callSetDbIds.map((callSetDbId, sampleIndex) => [samplesById[callSetDbId].sampleName, row[sampleIndex]]),
    values = Object.fromEntries(entries),
    f = {values};

    let position;
    let match;
    /** BrAPI is different to the other 2 flows - it requires an extra lookup
     * (POST /search/variants/) for position of variants which are returned in
     * data.variantDbIds
     */
    const usePositionFromName = false;
    if (usePositionFromName && (match = variantDbId.match(/(.+)_(.+)/))) {
      const
      [wholeString, database_scaffoldNumber, scaffoldOffsetText] = match;
      position = +scaffoldOffsetText;
      if (isNaN(position)) {
        position = 0;
      }
      f.value_0 = position;
      f.value = [position];
    }

    let feature = f;

    feature._name = variantDbId;
    feature.id = variantDbId;

    feature = featureMergeOrCreate(store, block, feature);

    return feature;
  });

  dLog(fnName, data.dataMatrices?.length, data.callSetDbIds?.length, columnNames.length);

  featureUpdateSelectedAndBlock(selectedService, block, createdFeatures);

  let result = {createdFeatures, sampleNames};
  return result;
}

// export { brapiGetVariantPosition }
function brapiGetVariantPosition(server, feature) {
  const
  fnName = 'brapiGetVariantPosition',
  variantDbId = feature.id,
  variantsP = server.variants([variantDbId]).then(data => {
    const
    /** data is response.result.data[] */
    d = data[0],
    values = feature.values,
    info = d.additionalInfo;
    feature.value = [+d.start];
    feature.value_0 = feature.value[0];
    if (d.end !== undefined) {
      feature.value[1] = +d.end;
    }
    if (d.referenceBases) {
      values.ref = d.referenceBases;
    }
    if (d.alternateBases) {
      values.alt = d.alternateBases.join(',');
    }
    if (info !== undefined) {
      values.INFO = info;
      const
      valuesAdd = pick(info, ['MAF', 'tSNP']);
      Object.assign(values, valuesAdd);
      if (info.AC && info.AN && +info.AN) {
        feature[callRateSymbol] = +info.AC / +info.AN;
      }
    }
    // dLog(fnName, feature);
  });
  return variantsP;
}

// -----------------------------------------------------------------------------

/** Convert numeric value from string to number.
 * If given value is not numeric, return the param.
 * Related : parseNumberFields(), parseBooleanFields();
 * @param text
 * @return text unchanged if it is not numeric
 */
function parseNumber(text) {
  const
  number = Number(text),
  result = isNaN(number) ? text : number;
  return result;
}
/** Convert numeric string values in object to number.
 */
function parseNumberFields(obj) {
  /** Convert numeric strings to numbers. */
  Object.entries(obj).forEach(([k, v]) => {
    const number = Number(v);
    if (! isNaN(number)) {
      obj[k] = number;
    }
  });
}


//------------------------------------------------------------------------------


export {
  // vcfColumn2Feature
  // columnNameINFOFix
  gtValueIsNumeric,
  datasetId2Class,
  addGerminateOptions,
  getDatasetFeaturesCounts,
  vcfGenotypeLookup,
  addFeaturesJson,
  // blockEnsureFeatureCount
  // mergeFeatureValues
  resultIsGerminate,
  addFeaturesGerminate,
  variantNameSplit,
  parseNumber,
  parseNumberFields,
};
