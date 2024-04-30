//------------------------------------------------------------------------------

// copied from @plantinformatics/pretzel frontend/app/utils/common/promises.js d04ce254

export { reduceInSeries };
/** Reduce the array to a promise; map each array element to a promise using
 * elt2PromiseFn, in series (not in parallel).
 * @param array
 * @param elt2PromiseFn (previousResult, element) -> promise
 * @param starting_promise  Start after this initial promise yields
 * Defaults to Promise.resolve() if undefined.
 */
function reduceInSeries(array, elt2PromiseFn, starting_promise) {
  /** based on ensureCounts() in lb4app/lb3app/common/utilities/block-features.js
   * and also https://stackoverflow.com/a/21372567 user663031
   * @param previousP head of chain of promises
   * @param previous result value yielded by previousP
   */
  const promise = array.reduce(
    (previousP, currentElement) => previousP.then(
      (previous) => elt2PromiseFn(previous, currentElement)),
    starting_promise ?? Promise.resolve());
  return promise;
}

//------------------------------------------------------------------------------
