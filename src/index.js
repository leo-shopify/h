/**
 * Convenience DOM creation and manipulation function compatible with JSX.
 * @module
 * @author leo-shopify <leonardo.rojas@shopify.com>
 */


/**
 * @type {function}
 */
const objToStr = Object.prototype.toString;


/**
 * @type {number}
 */
const DOCUMENT_FRAGMENT_NODE = 11;


/**
 * Tests if a value qualifies as an `attributes` object.  Valid `attributes`
 * are: `null`, `Map`, `WeakMap` and plain `Object`.  If the value is `Object`
 * and it has a `nodeType` key, and the value of the key is a `number` then it
 * has to be larger than 11.
 * @param {*} it The value to test.
 * @return {boolean} `true` if it is an `attributes` object.
 */
function isAttributes(it) {
  if (it === null) { return true; }
  if (!it) { return false; }
  const str = objToStr.call(it).substr(8); // eslint-disable-line no-magic-numbers
  if (str === 'Object]') {
    const val = it.nodeType;
    if (typeof val === 'number') { return val > DOCUMENT_FRAGMENT_NODE; }
    return true;
  }
  return str === 'Map]' || str === 'WeakMap]';
}


/**
 * Add children the element. Skip `null` and `undefined`. Recurse on `Array`.
 * If the item has a `nodeType` key, assume it is an HTMLElement or
 * DocumentFragment and add it. Otherwise convert it to a `Text` node.
 * @param {DocumentLike} doc Object implementing the DOM `Document` interface.
 * @param {HTMLElementLike} element The parent element.
 * @param {[*]} children The children.
 * @return {undefined} The parent element is modified in place.
 */
function addChildren(doc, element, children) {
  for (let i = children.length, child1 = element.firstChild, item; i--;) {
    item = children[i];
    if (item == null) { continue; } // eslint-disable-line no-eq-null, no-continue
    if (Array.isArray(item)) { addChildren(doc, element, item); }
    element.insertBefore(item.nodeType ? item : doc.createTextNode(item), child1);
  }
}


/**
 * @type {function}
 */
const toArray = Array.prototype.slice;


/**
 * Minimal Document interface needed by `h`.
 * @type {Object} DocumentLike
 * @prop {function(string)} createElement
 * @prop {function()} createDocumentFragment
 * @prop {function(string)} createTextNode
 */


/**
 * Minimal HTMLElement interface needed by `h`.
 * @type {Object} HTMLElementLike
 * @prop {number} [nodeType=1]
 * @prop {function(string, *)} setAttribute
 * @prop {function(string)} removeAttribute
 * @prop {function(HTMLElementLike)} appendChild
 * @prop {object} [attributes]
 * @prop {array} [children]
 * @prop {string} [tagName]
 */


/**
 * Minimal DocumentFragment interface needed by `h`.
 * @type {Object} DocumentFragmentLike
 * @prop {number} [nodeType=11]
 * @prop {function(HTMLElementLike)} appendChild
 * @prop {array} [children]
 */


/**
 * Closure to allow faking DOM `Document`.
 * @param {DocumentLike} doc Object implementing the DOM `Document` interface.
 * @return {function} `h` closed over `doc`.
 */
export function make(doc) {

  /**
   * Creates or modifies DOM elements.
   * @param {string | HTMLElementLike | function} [tag='div'] Either a string
   * representing the type of the element to create, an existing element to
   * modify, or a function to delegate the construction. Defaults to `'div'` if
   * absent.
   * @param {...*} [rest] Optional attributes and children.
   * @return {HTMLElementLike} Resulting DOM element.
   */
  return function h(tag /* ...rest */) {

    /**
     * Convert the `arguments` object to a real array skipping the first
     * argument.
     * @type {array}
     */
    const rest = toArray.call(arguments, 1); // eslint-disable-line prefer-rest-params

    /**
     * If `tag` is a function delegate and bail early.
     */
    if (typeof tag === 'function') {
      return tag.apply(null, rest); // eslint-disable-line prefer-spread
    }

    /**
     * Ensure `tag` is defined.
     */
    tag = tag || 'div'; // eslint-disable-line no-param-reassign
    let element;

    /**
     * Create the element.
     *
     * If type `string` -> create a new element.
     * If `tag.nodeType` is 1 -> assume it is an existing element.
     */
    if (typeof tag === 'string') {
      element = doc.createElement(tag);
    } else if (tag.nodeType && tag.nodeType === 1) {
      element = tag;
    } else {
      throw new TypeError('tag must be a string, an HTMLElement or a function');
    }

    /**
     * Add the attributes.
     *
     * If the first element from the arguments is an `attributes` value, remove
     * it from the array.
     *
     * The remaining elements of the array are necessarily the children.
     */
    if (isAttributes(rest[0])) {
      // const attributes = rest.shift();
      const attributes = rest[0];
      rest[0] = null;

      /**
       * Iterate over the attributes keys.
       *
       * If the value of the key is `undefined` or `null` remove the attribute
       * from the element. Otherwise add it.
       */
      const attrKeys = Object.keys(attributes);
      for (let i = attrKeys.length, attrKey, attrVal; i--;) {
        attrKey = attrKeys[i];
        attrVal = attributes[attrKey];

        /**
         * If the special key `$` is found, use it to populate the element's
         * properties.
         */
        if (attrKey === '$') {
          const propKeys = Object.keys(attrVal);
          for (let j = propKeys.length, propKey; j--;) {
            propKey = propKeys[j];
            element[propKey] = attrVal[propKey];
          }
        } else if (attrVal == null) { // eslint-disable-line no-eq-null
          element.removeAttribute(attrKey);
        } else {
          element.setAttribute(attrKey, attrVal);
        }
      }
    }

    /**
     * Add the children.
     */
    addChildren(doc, element, rest);

    return element;
  };
}


/* eslint-env browser */
export default make(document);
