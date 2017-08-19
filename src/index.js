/**
 * @module
 * @author leo-shopify <leonardo.rojas@shopify.com>
 */

/**
 * Tests if the parameter is a function.
 * @private
 * @function
 * @param {*} it The object to test.
 * @return {boolean}
 */
function isFunction(it) { return typeof it === 'function'; }

/**
 * Creates or updates DOM elements.
 * @public
 * @function
 * @param {string|HTMLElement|function} tag
 * @param {Object.<string>} [attributes]
 * @param {Array.<HTMLElement|string>|DocumentFragment} [children]
 * @return HTMLElement
 */
export function html(tag, attributes, children) {
  if (isFunction(tag)) {
    return tag(attributes, children);
  }

  const doc = document;
  let element;

  if (typeof tag === 'string') {
    element = doc.createElement(tag);
  } else if (isFunction(tag.appendChild)) {
    element = tag;
  } else {
    throw new TypeError('tag must be string, HTMLElement or function');
  }

  for (const key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      const attribute = attributes[key];
      if (key === '$') {
        for (const key2 in attribute) {
          if (attribute.hasOwnProperty(key2)) { element[key2] = attribute[key2]; }
        }
      } else {
        element[attribute == null ? 'removeAttribute' : 'setAttribute'](key, attribute);
      }
    }
  }

  if (children != null) {
    let child;
    if (Array.isArray(children)) {
      child = doc.createDocumentFragment();
      const len = children.length;
      for (let i = 0, item; i < len; i += 1) {
        item = children[i];
        if (item == null) { continue; }
        child.appendChild(item.nodeType ? item : doc.createTextNode(item));
      }
    } else if (children.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      child = children;
    } else {
      throw new TypeError('children must be an Array or a DocumentFragment');
    }
    element.appendChild(child);
  }

  return element;
}


/**
 * Use only in the test suite.
 * @private
 * @function
 */
export function _setGlobals(globals) {
  Object.assign(global, globals);
}


/* eslint id-length: 'off' */

const objToStr = Object.prototype.toString;

/**
 * Convenience interface to `html()` compatible with JSX.
 * @public
 * @function
 * @param {string|HTMLElement|function} tag
 * @param {...*} [rest] Optional attributes and children.
 * @return HTMLElement
 */
export default function h(tag) {
  const args = arguments; // eslint-disable-line prefer-rest-params
  const len = args.length;

  if (len < 2) { return html(tag); }

  // skip `node` in length
  let index = 1;
  let arg = args[index];
  let attributes;
  if (arg === null || objToStr.call(arg) === '[object Object]') {
    attributes = arg;
    index += 1;
  }

  arg = args[index];
  let children;
  if (Array.isArray(arg)) {
    children = arg;
  } else {
    children = [];
    while (index < len) {
      children[children.length] = args[index];
      index += 1;
    }
  }

  return html(tag, attributes, children);
}
