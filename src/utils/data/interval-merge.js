//------------------------------------------------------------------------------
/** intervalOutside and intervalMerge() are copied from pretzel/frontend/app/utils/interval-calcs.js 199fa9b4 */
export { intervalMerge };
//------------------------------------------------------------------------------
/* global d3 */

const
intervalLimit = [d3.min, d3.max],
/** Choose the outside values, as with d3.extent()
 * true if value a is outside the domain limit b.
 */
intervalOutside = [(a, b) => (a < b),
                   (a, b) => (a > b),
                  ];

/** Merge the given interval v into the domain, so that the result domain
 * contains the interval.
 *
 * Used within .reduce(),  e.g. :
 *       intervals.reduce(intervalMerge, []);
 * @param domain  result of merging the intervals.
 * form is [min, max].
 * @param v a single interval (feature value). can be either direction, i.e. doesn't assume  f[0] < f[1]
 * @see intervalExtent()
 */
function intervalMerge(domain, v) {
  // let v = f.get('valueOrdered');

  [0, 1].forEach(function (i) {
    /** the limit value of the interval v, in the direction i.
     * The result domain is ordered [min, max] whereas the input values v are
     * not; this translates the unordered value to the ordered result.
     */
    let limit = intervalLimit[i](v);
    if ((domain[i] === undefined) || intervalOutside[i](limit, domain[i]))
      domain[i] = limit;
  });

  return domain;
}
