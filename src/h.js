/**
 * Lightweight DOM element creation based on a subset of the hyperscript API and
 * compatible JSX.
 * @module
 * @author leo-shopify <leonardo.rojas@shopify.com>
 */


/**
 * @type {function}
 */
const objToStr = Object.prototype.toString;


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
 * Recursively copy an object.
 * @param {object} to The destination.
 * @param {object} from The source.
 * @return {undefined} Copies in-place.
 */
function deepCopy(to, from) {
  for (const prop in from) {
    if (from.hasOwnProperty(prop)) {
      if (typeof from[prop] === 'object' && from[prop] != null) {
        to[prop] = to[prop] || {};
        deepCopy(to[prop], from[prop]);
      } else {
        to[prop] = from[prop];
      }
    }
  }
}


/**
 * @type {string}
 */
const DEFAULT_TAG = 'div';

/**
 * Closure to allow faking DOM `Document`.
 * @param {DocumentLike} doc Object implementing the DOM `Document` interface.
 * @return {function} `h` closed over `doc`.
 */
export default function make(doc) {

  /**
   * Add the child to the element. Skip `null` and `undefined`. Recurse on
   * `Array`.  If the item has a `nodeType` key, assume it is an HTMLElement or
   * DocumentFragment and add it. Otherwise convert it to a `Text` node.
   * @param {HTMLElementLike} element The parent element.
   * @param {*} item The object to be appended as a child of element.
   * @return {HTMLElementLike} The modified parent element.
   */
  function addChildren(element, item) {
    if (item == null) { return element; }
    if (Array.isArray(item)) { return item.reduce(addChildren, element); }
    element.appendChild(item.nodeType ? item : doc.createTextNode(item));
    return element;
  }


  /**
   * Creates or modifies DOM elements.
   * @param {string | HTMLElementLike | function} [tag='div'] Either a string
   * representing the type of the element to create, an existing element to
   * modify, or a function to delegate the construction. Defaults to `'div'` if
   * falsy.
   * @param {object | null} [attributes=null] Optional attributes object.
   * @param {...*} [children] Optional children.
   * @return {HTMLElementLike} Resulting DOM element.
   */
  return function h(/* ...args */) {

    /**
     * Convert the `arguments` object to a real array skipping the first
     * argument.
     * @type {array}
     */
    const args = toArray.call(arguments, 1); // eslint-disable-line prefer-rest-params

    /**
     * Ensure `tag` is defined.
     */
    const tag = arguments[0] || DEFAULT_TAG; // eslint-disable-line prefer-rest-params

    /**
     * If `tag` is a function delegate and bail early.
     */
    if (typeof tag === 'function') {
      return tag.apply(null, args); // eslint-disable-line prefer-spread
    }

    /**
     * Create the element.
     *
     * If `tag.nodeType` is 1 assume it is an existing element.
     * Else coerce to `string` and create a new element.
     */
    let element;

    if (tag.nodeType && tag.nodeType === 1) {
      element = tag;
    } else {
      // eslint-disable-next-line no-implicit-coercion, prefer-template
      element = doc.createElement(tag + '' || DEFAULT_TAG);
    }

    /**
     * Add the attributes.
     *
     *
     * A value qualifies as an `attributes` object if it is: `null`, `Map`,
     * `WeakMap` and plain `Object`.  If the value is `Object` it cannot contain
     * a `nodeType` key.
     */
    const first = args[0];
    const asStr = objToStr.call(first).substr(8); // eslint-disable-line no-magic-numbers
    if (first === null ||
        (asStr === 'Object]' && !('nodeType' in first)) ||
        asStr === 'Map]' ||
        asStr === 'WeakMap]') {

      /**
       * If the first element from the arguments is an `attributes` value, copy
       * it and set the original to null which is skipped by the children
       * processor. This is faster than `Array.shift()`.
       */
      const attributes = first;
      args[0] = null;

      /**
       * Iterate over the attributes keys.
       */
      for (const attrKey in attributes) { // eslint-disable-line guard-for-in
        const attrVal = attributes[attrKey];

        /**
         * If the special key `$` is found, use it to populate the element's
         * properties.
         *
         * If the value of the key is `function` set it as a property.
         *
         * If the value of the key is `undefined` or `null` remove the attribute
         * from the element. Otherwise add it.
         */
        if (attrKey === '$') {
          deepCopy(element, attrVal);
        } else if (attrVal == null) {
          element.removeAttribute(attrKey);
        } else {
          element.setAttribute(attrKey, attrVal);
        }
      }
    }

    /**
     * The remaining elements of `rest` are the children. Add them to the
     * element.
     */
    return args.reduce(addChildren, element);
  };
}
