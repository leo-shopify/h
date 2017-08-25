'use strict';

(function () {
  'use strict';

  /**
   * Lightweight DOM element creation based on a subset of the hyperscript API and
   * compatible with JSX.
   * @module
   * @author leo-shopify <leonardo.rojas@shopify.com>
   */

  /**
   * @type {function}
   */

  var objToStr = Object.prototype.toString;

  /**
   * @type {function}
   */
  var toArray = Array.prototype.slice;

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
    for (var prop in from) {
      if (from.hasOwnProperty(prop)) {
        if (typeof from[prop] === 'object' && from[prop] != null) {
          if (typeof to[prop] !== 'object' || to[prop] == null) {
            to[prop] = {};
          }
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
  var DEFAULT_TAG = 'div';

  /**
   * Closure to allow faking DOM `Document`.
   * @param {DocumentLike} doc Object implementing the DOM `Document` interface.
   * @return {function} `h` closed over `doc`.
   */
  function make(doc) {

    /**
     * Add the child to the element. Skip `null` and `undefined`. Recurse on
     * `Array`.  If the item has a `nodeType` key, assume it is an HTMLElement or
     * DocumentFragment and add it. Otherwise convert it to a `Text` node.
     * @param {HTMLElementLike} element The parent element.
     * @param {*} item The object to be appended as a child of element.
     * @return {HTMLElementLike} The modified parent element.
     */
    function addChildren(element, item) {
      if (item == null) {
        return element;
      }
      if (Array.isArray(item)) {
        return item.reduce(addChildren, element);
      }
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
    return function h() /* ...args */{

      /**
       * Convert the `arguments` object to a real array skipping the first
       * argument.
       * @type {array}
       */
      var args = toArray.call(arguments, 1); // eslint-disable-line prefer-rest-params

      /**
       * Ensure `tag` is defined.
       */
      var tag = arguments[0] || DEFAULT_TAG; // eslint-disable-line prefer-rest-params

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
      var element = void 0;

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
      var first = args[0];
      if (first === null || objToStr.call(first) === '[object Object]' && !('nodeType' in first)) {

        /**
         * If the first element from the arguments is an `attributes` value, copy
         * it and set the original to null which is skipped by the children
         * processor. This is faster than `Array.shift()`.
         */
        var attributes = first;
        args[0] = null;

        /**
         * Iterate over the attributes keys.
         */
        for (var attrKey in attributes) {
          // eslint-disable-line guard-for-in
          var attrVal = attributes[attrKey];

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

  /* eslint-env browser */

  var h = make(document);

  /* eslint
     prefer-arrow-callback: off,
     space-before-function-paren: off,
     no-var: off
  */
  /* global describe, it, chai */

  var assert = chai.assert;

  describe('Examples', function () {
    describe('First example in README.md.', function () {
      it('h("section", h("h1", {class: "hero"}, "Plans"),...) → <section><h1 class="hero">Plans</h1>...', function () {
        var when = h('section', h('h1', { class: 'hero' }, 'Plans'), h('ol', h('li', { $: { style: { color: 'grey' } } }, "I'm taking a ride ", 'with my best friend.')));
        var result = document.createElement('section');
        result.innerHTML = '<h1 class="hero">Plans</h1><ol><li style="color: grey;">' + 'I\'m taking a ride with my best friend.</li></ol>';
        assert.strictEqual(when.outerHTML, result.outerHTML);
      });
    });
  });

  describe('API', function () {
    describe('Calling h with no arguments or a falsy value returns an HTMLDivElement.', function () {
      it('h( ) → <div/>', function () {
        var when = h();
        var result = 'DIV';
        assert.strictEqual(when.tagName, result);
      });
      it('h("") → <div/>', function () {
        var when = h('');
        var result = 'DIV';
        assert.strictEqual(when.tagName, result);
      });
      it('h(null) → <div/>', function () {
        var when = h(null);
        var result = 'DIV';
        assert.strictEqual(when.tagName, result);
      });
      it('Other falsy values → <div/>', function () {
        var expect = 'DIV';
        assert.strictEqual(h(false).tagName, expect);
        assert.strictEqual(h(0).tagName, expect);
        assert.strictEqual(h(NaN).tagName, expect);
        assert.strictEqual(h([]).tagName, expect);
      });
    });

    describe('Calling h with a string as the first argument returns an HTMLElement with that tag.', function () {
      // h(string)
      it('h("a") → <a/>', function () {
        var when = h('a');
        var result = 'A';
        assert.strictEqual(when.tagName, result);
      });
      it('h("my-custom-tag") → <my-custom-tag/>', function () {
        var when = h('my-custom-tag');
        var result = 'MY-CUSTOM-TAG';
        assert.strictEqual(when.tagName, result);
      });
    });

    describe('Calling h with a function as the first argument returns the result of delegating the arguments to the function.', function () {
      it('h(h, "a", {id: "id"}, "hello") → <a id="id">hello</a>', function () {
        var when = h(h, 'a', { id: 'id' }, 'hello');
        var result = h('a', { id: 'id' }, 'hello');
        assert.strictEqual(when.tagName, result.tagName);
        assert.strictEqual(when.id, result.id);
        assert.strictEqual(when.firstChild.nodeValue, result.firstChild.nodeValue);
      });
    });

    describe('Calling h with an HTMLelement as the first argument returns the same HTMLElement.', function () {
      it('h(document.createElement("section")) → <section/>', function () {
        var result = document.createElement('section');
        var when = h(result);
        assert.strictEqual(when, result);
      });
    });

    describe('Calling h with an HTMLelement and attributes and children returns the modified HTMLElement.', function () {
      it('h(document.createElement("a"), {"class": "war"}, "Groucho") → <a class="war">Groucho</a>', function () {
        var result = document.createElement('a');
        var when = h(result, { class: 'war' }, 'Groucho');
        assert.strictEqual(when.tagName, result.tagName);
        assert.strictEqual(when.id, result.id);
        assert.strictEqual(when.firstChild.nodeValue, result.firstChild.nodeValue);
      });
    });
  });

  describe('Corner cases', function () {
    describe('Calling h with a first argument other than a string, function or HTMLElement:', function () {
      it('Returns an HTMLElement with the value coerced to a string as a tag.', function () {
        assert.strictEqual(h(true).tagName, 'TRUE');
      });
      it('Throws an error if the tag is invalid.', function () {
        assert.throws(function () {
          h(123);
        }, /(not a )|(in)valid/gi);
        assert.throws(function () {
          h({});
        }, /(not a )|(in)valid/gi);
      });
    });

    /*
      describe('with null as the 2nd argument');
      describe('with a plain object as the 2nd argument');
      describe('with a plain object containing a `$: null` as the 2nd argument');
      describe('with a plain object containing a `$: []` as the 2nd argument');
      describe('with a plain object containing a `$: {}` as the 2nd argument');
      describe('with a plain object containing a `$: {...{}}` as the 2nd argument');
       describe('with a string as the 2nd argument');
      describe('with a plain object containing a `nodeType` key as the 2nd argument');
      describe('with an array as the 2nd argument');
      describe('with nested arrays as the 2nd argument');
    */
  });
})();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QVAsQ0FBa0IsU0FBaEU7QUFDRCxPQU5EO0FBT0QsS0FSRDtBQVNELEdBbkVEOztBQXNFQSxXQUFTLGNBQVQsRUFBeUIsWUFBWTtBQUNuQyxhQUFTLCtFQUFULEVBQTBGLFlBQVk7QUFDcEcsU0FBRyxxRUFBSCxFQUEwRSxZQUFZO0FBQ3BGLGVBQU8sV0FBUCxDQUFtQixFQUFFLElBQUYsRUFBUSxPQUEzQixFQUFvQyxNQUFwQztBQUNELE9BRkQ7QUFHQSxTQUFHLHdDQUFILEVBQTZDLFlBQVk7QUFDdkQsZUFBTyxNQUFQLENBQWMsWUFBWTtBQUFFLFlBQUUsR0FBRjtBQUFTLFNBQXJDLEVBQXVDLHNCQUF2QztBQUNBLGVBQU8sTUFBUCxDQUFjLFlBQVk7QUFBRSxZQUFFLEVBQUY7QUFBUSxTQUFwQyxFQUFzQyxzQkFBdEM7QUFDRCxPQUhEO0FBSUQsS0FSRDs7QUFVQTs7Ozs7Ozs7Ozs7O0FBYUQsR0F4QkQ7QUEwQkMsQ0EzVUEsR0FBRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoKSB7XG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTGlnaHR3ZWlnaHQgRE9NIGVsZW1lbnQgY3JlYXRpb24gYmFzZWQgb24gYSBzdWJzZXQgb2YgdGhlIGh5cGVyc2NyaXB0IEFQSSBhbmRcbiAqIGNvbXBhdGlibGUgd2l0aCBKU1guXG4gKiBAbW9kdWxlXG4gKiBAYXV0aG9yIGxlby1zaG9waWZ5IDxsZW9uYXJkby5yb2phc0BzaG9waWZ5LmNvbT5cbiAqL1xuXG5cbi8qKlxuICogQHR5cGUge2Z1bmN0aW9ufVxuICovXG5jb25zdCBvYmpUb1N0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cblxuLyoqXG4gKiBAdHlwZSB7ZnVuY3Rpb259XG4gKi9cbmNvbnN0IHRvQXJyYXkgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cblxuLyoqXG4gKiBNaW5pbWFsIERvY3VtZW50IGludGVyZmFjZSBuZWVkZWQgYnkgYGhgLlxuICogQHR5cGUge09iamVjdH0gRG9jdW1lbnRMaWtlXG4gKiBAcHJvcCB7ZnVuY3Rpb24oc3RyaW5nKX0gY3JlYXRlRWxlbWVudFxuICogQHByb3Age2Z1bmN0aW9uKCl9IGNyZWF0ZURvY3VtZW50RnJhZ21lbnRcbiAqIEBwcm9wIHtmdW5jdGlvbihzdHJpbmcpfSBjcmVhdGVUZXh0Tm9kZVxuICovXG5cblxuLyoqXG4gKiBNaW5pbWFsIEhUTUxFbGVtZW50IGludGVyZmFjZSBuZWVkZWQgYnkgYGhgLlxuICogQHR5cGUge09iamVjdH0gSFRNTEVsZW1lbnRMaWtlXG4gKiBAcHJvcCB7bnVtYmVyfSBbbm9kZVR5cGU9MV1cbiAqIEBwcm9wIHtmdW5jdGlvbihzdHJpbmcsICopfSBzZXRBdHRyaWJ1dGVcbiAqIEBwcm9wIHtmdW5jdGlvbihzdHJpbmcpfSByZW1vdmVBdHRyaWJ1dGVcbiAqIEBwcm9wIHtmdW5jdGlvbihIVE1MRWxlbWVudExpa2UpfSBhcHBlbmRDaGlsZFxuICogQHByb3Age29iamVjdH0gW2F0dHJpYnV0ZXNdXG4gKiBAcHJvcCB7YXJyYXl9IFtjaGlsZHJlbl1cbiAqIEBwcm9wIHtzdHJpbmd9IFt0YWdOYW1lXVxuICovXG5cblxuLyoqXG4gKiBNaW5pbWFsIERvY3VtZW50RnJhZ21lbnQgaW50ZXJmYWNlIG5lZWRlZCBieSBgaGAuXG4gKiBAdHlwZSB7T2JqZWN0fSBEb2N1bWVudEZyYWdtZW50TGlrZVxuICogQHByb3Age251bWJlcn0gW25vZGVUeXBlPTExXVxuICogQHByb3Age2Z1bmN0aW9uKEhUTUxFbGVtZW50TGlrZSl9IGFwcGVuZENoaWxkXG4gKiBAcHJvcCB7YXJyYXl9IFtjaGlsZHJlbl1cbiAqL1xuXG5cbi8qKlxuICogUmVjdXJzaXZlbHkgY29weSBhbiBvYmplY3QuXG4gKiBAcGFyYW0ge29iamVjdH0gdG8gVGhlIGRlc3RpbmF0aW9uLlxuICogQHBhcmFtIHtvYmplY3R9IGZyb20gVGhlIHNvdXJjZS5cbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gQ29waWVzIGluLXBsYWNlLlxuICovXG5mdW5jdGlvbiBkZWVwQ29weSh0bywgZnJvbSkge1xuICBmb3IgKGNvbnN0IHByb3AgaW4gZnJvbSkge1xuICAgIGlmIChmcm9tLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICBpZiAodHlwZW9mIGZyb21bcHJvcF0gPT09ICdvYmplY3QnICYmIGZyb21bcHJvcF0gIT0gbnVsbCkge1xuICAgICAgICBpZiAodHlwZW9mIHRvW3Byb3BdICE9PSAnb2JqZWN0JyB8fCB0b1twcm9wXSA9PSBudWxsKSB7XG4gICAgICAgICAgdG9bcHJvcF0gPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBkZWVwQ29weSh0b1twcm9wXSwgZnJvbVtwcm9wXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0b1twcm9wXSA9IGZyb21bcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBAdHlwZSB7c3RyaW5nfVxuICovXG5jb25zdCBERUZBVUxUX1RBRyA9ICdkaXYnO1xuXG4vKipcbiAqIENsb3N1cmUgdG8gYWxsb3cgZmFraW5nIERPTSBgRG9jdW1lbnRgLlxuICogQHBhcmFtIHtEb2N1bWVudExpa2V9IGRvYyBPYmplY3QgaW1wbGVtZW50aW5nIHRoZSBET00gYERvY3VtZW50YCBpbnRlcmZhY2UuXG4gKiBAcmV0dXJuIHtmdW5jdGlvbn0gYGhgIGNsb3NlZCBvdmVyIGBkb2NgLlxuICovXG5mdW5jdGlvbiBtYWtlKGRvYykge1xuXG4gIC8qKlxuICAgKiBBZGQgdGhlIGNoaWxkIHRvIHRoZSBlbGVtZW50LiBTa2lwIGBudWxsYCBhbmQgYHVuZGVmaW5lZGAuIFJlY3Vyc2Ugb25cbiAgICogYEFycmF5YC4gIElmIHRoZSBpdGVtIGhhcyBhIGBub2RlVHlwZWAga2V5LCBhc3N1bWUgaXQgaXMgYW4gSFRNTEVsZW1lbnQgb3JcbiAgICogRG9jdW1lbnRGcmFnbWVudCBhbmQgYWRkIGl0LiBPdGhlcndpc2UgY29udmVydCBpdCB0byBhIGBUZXh0YCBub2RlLlxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50TGlrZX0gZWxlbWVudCBUaGUgcGFyZW50IGVsZW1lbnQuXG4gICAqIEBwYXJhbSB7Kn0gaXRlbSBUaGUgb2JqZWN0IHRvIGJlIGFwcGVuZGVkIGFzIGEgY2hpbGQgb2YgZWxlbWVudC5cbiAgICogQHJldHVybiB7SFRNTEVsZW1lbnRMaWtlfSBUaGUgbW9kaWZpZWQgcGFyZW50IGVsZW1lbnQuXG4gICAqL1xuICBmdW5jdGlvbiBhZGRDaGlsZHJlbihlbGVtZW50LCBpdGVtKSB7XG4gICAgaWYgKGl0ZW0gPT0gbnVsbCkgeyByZXR1cm4gZWxlbWVudDsgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW0pKSB7IHJldHVybiBpdGVtLnJlZHVjZShhZGRDaGlsZHJlbiwgZWxlbWVudCk7IH1cbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGl0ZW0ubm9kZVR5cGUgPyBpdGVtIDogZG9jLmNyZWF0ZVRleHROb2RlKGl0ZW0pKTtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgb3IgbW9kaWZpZXMgRE9NIGVsZW1lbnRzLlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IEhUTUxFbGVtZW50TGlrZSB8IGZ1bmN0aW9ufSBbdGFnPSdkaXYnXSBFaXRoZXIgYSBzdHJpbmdcbiAgICogcmVwcmVzZW50aW5nIHRoZSB0eXBlIG9mIHRoZSBlbGVtZW50IHRvIGNyZWF0ZSwgYW4gZXhpc3RpbmcgZWxlbWVudCB0b1xuICAgKiBtb2RpZnksIG9yIGEgZnVuY3Rpb24gdG8gZGVsZWdhdGUgdGhlIGNvbnN0cnVjdGlvbi4gRGVmYXVsdHMgdG8gYCdkaXYnYCBpZlxuICAgKiBmYWxzeS5cbiAgICogQHBhcmFtIHtvYmplY3QgfCBudWxsfSBbYXR0cmlidXRlcz1udWxsXSBPcHRpb25hbCBhdHRyaWJ1dGVzIG9iamVjdC5cbiAgICogQHBhcmFtIHsuLi4qfSBbY2hpbGRyZW5dIE9wdGlvbmFsIGNoaWxkcmVuLlxuICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudExpa2V9IFJlc3VsdGluZyBET00gZWxlbWVudC5cbiAgICovXG4gIHJldHVybiBmdW5jdGlvbiBoKC8qIC4uLmFyZ3MgKi8pIHtcblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgdGhlIGBhcmd1bWVudHNgIG9iamVjdCB0byBhIHJlYWwgYXJyYXkgc2tpcHBpbmcgdGhlIGZpcnN0XG4gICAgICogYXJndW1lbnQuXG4gICAgICogQHR5cGUge2FycmF5fVxuICAgICAqL1xuICAgIGNvbnN0IGFyZ3MgPSB0b0FycmF5LmNhbGwoYXJndW1lbnRzLCAxKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBwcmVmZXItcmVzdC1wYXJhbXNcblxuICAgIC8qKlxuICAgICAqIEVuc3VyZSBgdGFnYCBpcyBkZWZpbmVkLlxuICAgICAqL1xuICAgIGNvbnN0IHRhZyA9IGFyZ3VtZW50c1swXSB8fCBERUZBVUxUX1RBRzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBwcmVmZXItcmVzdC1wYXJhbXNcblxuICAgIC8qKlxuICAgICAqIElmIGB0YWdgIGlzIGEgZnVuY3Rpb24gZGVsZWdhdGUgYW5kIGJhaWwgZWFybHkuXG4gICAgICovXG4gICAgaWYgKHR5cGVvZiB0YWcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB0YWcuYXBwbHkobnVsbCwgYXJncyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcHJlZmVyLXNwcmVhZFxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSB0aGUgZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGB0YWcubm9kZVR5cGVgIGlzIDEgYXNzdW1lIGl0IGlzIGFuIGV4aXN0aW5nIGVsZW1lbnQuXG4gICAgICogRWxzZSBjb2VyY2UgdG8gYHN0cmluZ2AgYW5kIGNyZWF0ZSBhIG5ldyBlbGVtZW50LlxuICAgICAqL1xuICAgIGxldCBlbGVtZW50O1xuXG4gICAgaWYgKHRhZy5ub2RlVHlwZSAmJiB0YWcubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgIGVsZW1lbnQgPSB0YWc7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1pbXBsaWNpdC1jb2VyY2lvbiwgcHJlZmVyLXRlbXBsYXRlXG4gICAgICBlbGVtZW50ID0gZG9jLmNyZWF0ZUVsZW1lbnQodGFnICsgJycgfHwgREVGQVVMVF9UQUcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCB0aGUgYXR0cmlidXRlcy5cbiAgICAgKlxuICAgICAqXG4gICAgICogQSB2YWx1ZSBxdWFsaWZpZXMgYXMgYW4gYGF0dHJpYnV0ZXNgIG9iamVjdCBpZiBpdCBpczogYG51bGxgLCBgTWFwYCxcbiAgICAgKiBgV2Vha01hcGAgYW5kIHBsYWluIGBPYmplY3RgLiAgSWYgdGhlIHZhbHVlIGlzIGBPYmplY3RgIGl0IGNhbm5vdCBjb250YWluXG4gICAgICogYSBgbm9kZVR5cGVgIGtleS5cbiAgICAgKi9cbiAgICBjb25zdCBmaXJzdCA9IGFyZ3NbMF07XG4gICAgaWYgKGZpcnN0ID09PSBudWxsIHx8XG4gICAgICAgIChvYmpUb1N0ci5jYWxsKGZpcnN0KSA9PT0gJ1tvYmplY3QgT2JqZWN0XScgJiYgISgnbm9kZVR5cGUnIGluIGZpcnN0KSkpIHtcblxuICAgICAgLyoqXG4gICAgICAgKiBJZiB0aGUgZmlyc3QgZWxlbWVudCBmcm9tIHRoZSBhcmd1bWVudHMgaXMgYW4gYGF0dHJpYnV0ZXNgIHZhbHVlLCBjb3B5XG4gICAgICAgKiBpdCBhbmQgc2V0IHRoZSBvcmlnaW5hbCB0byBudWxsIHdoaWNoIGlzIHNraXBwZWQgYnkgdGhlIGNoaWxkcmVuXG4gICAgICAgKiBwcm9jZXNzb3IuIFRoaXMgaXMgZmFzdGVyIHRoYW4gYEFycmF5LnNoaWZ0KClgLlxuICAgICAgICovXG4gICAgICBjb25zdCBhdHRyaWJ1dGVzID0gZmlyc3Q7XG4gICAgICBhcmdzWzBdID0gbnVsbDtcblxuICAgICAgLyoqXG4gICAgICAgKiBJdGVyYXRlIG92ZXIgdGhlIGF0dHJpYnV0ZXMga2V5cy5cbiAgICAgICAqL1xuICAgICAgZm9yIChjb25zdCBhdHRyS2V5IGluIGF0dHJpYnV0ZXMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBndWFyZC1mb3ItaW5cbiAgICAgICAgY29uc3QgYXR0clZhbCA9IGF0dHJpYnV0ZXNbYXR0cktleV07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIHRoZSBzcGVjaWFsIGtleSBgJGAgaXMgZm91bmQsIHVzZSBpdCB0byBwb3B1bGF0ZSB0aGUgZWxlbWVudCdzXG4gICAgICAgICAqIHByb3BlcnRpZXMuXG4gICAgICAgICAqXG4gICAgICAgICAqIElmIHRoZSB2YWx1ZSBvZiB0aGUga2V5IGlzIGBmdW5jdGlvbmAgc2V0IGl0IGFzIGEgcHJvcGVydHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIElmIHRoZSB2YWx1ZSBvZiB0aGUga2V5IGlzIGB1bmRlZmluZWRgIG9yIGBudWxsYCByZW1vdmUgdGhlIGF0dHJpYnV0ZVxuICAgICAgICAgKiBmcm9tIHRoZSBlbGVtZW50LiBPdGhlcndpc2UgYWRkIGl0LlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKGF0dHJLZXkgPT09ICckJykge1xuICAgICAgICAgIGRlZXBDb3B5KGVsZW1lbnQsIGF0dHJWYWwpO1xuICAgICAgICB9IGVsc2UgaWYgKGF0dHJWYWwgPT0gbnVsbCkge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGF0dHJLZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKGF0dHJLZXksIGF0dHJWYWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIHJlbWFpbmluZyBlbGVtZW50cyBvZiBgcmVzdGAgYXJlIHRoZSBjaGlsZHJlbi4gQWRkIHRoZW0gdG8gdGhlXG4gICAgICogZWxlbWVudC5cbiAgICAgKi9cbiAgICByZXR1cm4gYXJncy5yZWR1Y2UoYWRkQ2hpbGRyZW4sIGVsZW1lbnQpO1xuICB9O1xufVxuXG4vKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxudmFyIGggPSBtYWtlKGRvY3VtZW50KTtcblxuLyogZXNsaW50XG4gICBwcmVmZXItYXJyb3ctY2FsbGJhY2s6IG9mZixcbiAgIHNwYWNlLWJlZm9yZS1mdW5jdGlvbi1wYXJlbjogb2ZmLFxuICAgbm8tdmFyOiBvZmZcbiovXG4vKiBnbG9iYWwgZGVzY3JpYmUsIGl0LCBjaGFpICovXG5cbnZhciBhc3NlcnQgPSBjaGFpLmFzc2VydDtcblxuXG5kZXNjcmliZSgnRXhhbXBsZXMnLCBmdW5jdGlvbiAoKSB7XG4gIGRlc2NyaWJlKCdGaXJzdCBleGFtcGxlIGluIFJFQURNRS5tZC4nLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ2goXCJzZWN0aW9uXCIsIGgoXCJoMVwiLCB7Y2xhc3M6IFwiaGVyb1wifSwgXCJQbGFuc1wiKSwuLi4pIOKGkiA8c2VjdGlvbj48aDEgY2xhc3M9XCJoZXJvXCI+UGxhbnM8L2gxPi4uLicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciB3aGVuID0gaCgnc2VjdGlvbicsXG4gICAgICAgICAgICAgICAgICAgaCgnaDEnLCB7Y2xhc3M6ICdoZXJvJ30sICdQbGFucycpLFxuICAgICAgICAgICAgICAgICAgIGgoJ29sJyxcbiAgICAgICAgICAgICAgICAgICAgIGgoJ2xpJywgeyQ6IHtzdHlsZToge2NvbG9yOiAnZ3JleSd9fX0sXG4gICAgICAgICAgICAgICAgICAgICAgIFwiSSdtIHRha2luZyBhIHJpZGUgXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICd3aXRoIG15IGJlc3QgZnJpZW5kLicpKSk7XG4gICAgICB2YXIgcmVzdWx0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VjdGlvbicpO1xuICAgICAgcmVzdWx0LmlubmVySFRNTCA9ICc8aDEgY2xhc3M9XCJoZXJvXCI+UGxhbnM8L2gxPjxvbD48bGkgc3R5bGU9XCJjb2xvcjogZ3JleTtcIj4nICtcbiAgICAgICAgJ0lcXCdtIHRha2luZyBhIHJpZGUgd2l0aCBteSBiZXN0IGZyaWVuZC48L2xpPjwvb2w+JztcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh3aGVuLm91dGVySFRNTCwgcmVzdWx0Lm91dGVySFRNTCk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG5cblxuZGVzY3JpYmUoJ0FQSScsIGZ1bmN0aW9uICgpIHtcbiAgZGVzY3JpYmUoJ0NhbGxpbmcgaCB3aXRoIG5vIGFyZ3VtZW50cyBvciBhIGZhbHN5IHZhbHVlIHJldHVybnMgYW4gSFRNTERpdkVsZW1lbnQuJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdoKCApIOKGkiA8ZGl2Lz4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgd2hlbiA9IGgoKTtcbiAgICAgIHZhciByZXN1bHQgPSAnRElWJztcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh3aGVuLnRhZ05hbWUsIHJlc3VsdCk7XG4gICAgfSk7XG4gICAgaXQoJ2goXCJcIikg4oaSIDxkaXYvPicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciB3aGVuID0gaCgnJyk7XG4gICAgICB2YXIgcmVzdWx0ID0gJ0RJVic7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwod2hlbi50YWdOYW1lLCByZXN1bHQpO1xuICAgIH0pO1xuICAgIGl0KCdoKG51bGwpIOKGkiA8ZGl2Lz4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgd2hlbiA9IGgobnVsbCk7XG4gICAgICB2YXIgcmVzdWx0ID0gJ0RJVic7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwod2hlbi50YWdOYW1lLCByZXN1bHQpO1xuICAgIH0pO1xuICAgIGl0KCdPdGhlciBmYWxzeSB2YWx1ZXMg4oaSIDxkaXYvPicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBleHBlY3QgPSAnRElWJztcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChoKGZhbHNlKS50YWdOYW1lLCBleHBlY3QpO1xuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGgoMCkudGFnTmFtZSwgZXhwZWN0KTtcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChoKE5hTikudGFnTmFtZSwgZXhwZWN0KTtcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChoKFtdKS50YWdOYW1lLCBleHBlY3QpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQ2FsbGluZyBoIHdpdGggYSBzdHJpbmcgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHJldHVybnMgYW4gSFRNTEVsZW1lbnQgd2l0aCB0aGF0IHRhZy4nLCBmdW5jdGlvbiAoKSB7XG4gICAgLy8gaChzdHJpbmcpXG4gICAgaXQoJ2goXCJhXCIpIOKGkiA8YS8+JywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHdoZW4gPSBoKCdhJyk7XG4gICAgICB2YXIgcmVzdWx0ID0gJ0EnO1xuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHdoZW4udGFnTmFtZSwgcmVzdWx0KTtcbiAgICB9KTtcbiAgICBpdCgnaChcIm15LWN1c3RvbS10YWdcIikg4oaSIDxteS1jdXN0b20tdGFnLz4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgd2hlbiA9IGgoJ215LWN1c3RvbS10YWcnKTtcbiAgICAgIHZhciByZXN1bHQgPSAnTVktQ1VTVE9NLVRBRyc7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwod2hlbi50YWdOYW1lLCByZXN1bHQpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQ2FsbGluZyBoIHdpdGggYSBmdW5jdGlvbiBhcyB0aGUgZmlyc3QgYXJndW1lbnQgcmV0dXJucyB0aGUgcmVzdWx0IG9mIGRlbGVnYXRpbmcgdGhlIGFyZ3VtZW50cyB0byB0aGUgZnVuY3Rpb24uJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdoKGgsIFwiYVwiLCB7aWQ6IFwiaWRcIn0sIFwiaGVsbG9cIikg4oaSIDxhIGlkPVwiaWRcIj5oZWxsbzwvYT4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgd2hlbiA9IGgoaCwgJ2EnLCB7aWQ6ICdpZCd9LCAnaGVsbG8nKTtcbiAgICAgIHZhciByZXN1bHQgPSBoKCdhJywge2lkOiAnaWQnfSwgJ2hlbGxvJyk7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwod2hlbi50YWdOYW1lLCByZXN1bHQudGFnTmFtZSk7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwod2hlbi5pZCwgcmVzdWx0LmlkKTtcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh3aGVuLmZpcnN0Q2hpbGQubm9kZVZhbHVlLCByZXN1bHQuZmlyc3RDaGlsZC5ub2RlVmFsdWUpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQ2FsbGluZyBoIHdpdGggYW4gSFRNTGVsZW1lbnQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHJldHVybnMgdGhlIHNhbWUgSFRNTEVsZW1lbnQuJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWN0aW9uXCIpKSDihpIgPHNlY3Rpb24vPicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciByZXN1bHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWN0aW9uJyk7XG4gICAgICB2YXIgd2hlbiA9IGgocmVzdWx0KTtcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh3aGVuLCByZXN1bHQpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQ2FsbGluZyBoIHdpdGggYW4gSFRNTGVsZW1lbnQgYW5kIGF0dHJpYnV0ZXMgYW5kIGNoaWxkcmVuIHJldHVybnMgdGhlIG1vZGlmaWVkIEhUTUxFbGVtZW50LicsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnaChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKSwge1wiY2xhc3NcIjogXCJ3YXJcIn0sIFwiR3JvdWNob1wiKSDihpIgPGEgY2xhc3M9XCJ3YXJcIj5Hcm91Y2hvPC9hPicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciByZXN1bHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICB2YXIgd2hlbiA9IGgocmVzdWx0LCB7Y2xhc3M6ICd3YXInfSwgJ0dyb3VjaG8nKTtcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh3aGVuLnRhZ05hbWUsIHJlc3VsdC50YWdOYW1lKTtcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh3aGVuLmlkLCByZXN1bHQuaWQpO1xuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHdoZW4uZmlyc3RDaGlsZC5ub2RlVmFsdWUsIHJlc3VsdC5maXJzdENoaWxkLm5vZGVWYWx1ZSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG5cblxuZGVzY3JpYmUoJ0Nvcm5lciBjYXNlcycsIGZ1bmN0aW9uICgpIHtcbiAgZGVzY3JpYmUoJ0NhbGxpbmcgaCB3aXRoIGEgZmlyc3QgYXJndW1lbnQgb3RoZXIgdGhhbiBhIHN0cmluZywgZnVuY3Rpb24gb3IgSFRNTEVsZW1lbnQ6JywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdSZXR1cm5zIGFuIEhUTUxFbGVtZW50IHdpdGggdGhlIHZhbHVlIGNvZXJjZWQgdG8gYSBzdHJpbmcgYXMgYSB0YWcuJywgZnVuY3Rpb24gKCkge1xuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGgodHJ1ZSkudGFnTmFtZSwgJ1RSVUUnKTtcbiAgICB9KTtcbiAgICBpdCgnVGhyb3dzIGFuIGVycm9yIGlmIHRoZSB0YWcgaXMgaW52YWxpZC4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICBhc3NlcnQudGhyb3dzKGZ1bmN0aW9uICgpIHsgaCgxMjMpOyB9LCAvKG5vdCBhICl8KGluKXZhbGlkL2dpKTtcbiAgICAgIGFzc2VydC50aHJvd3MoZnVuY3Rpb24gKCkgeyBoKHt9KTsgfSwgLyhub3QgYSApfChpbil2YWxpZC9naSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8qXG4gICAgZGVzY3JpYmUoJ3dpdGggbnVsbCBhcyB0aGUgMm5kIGFyZ3VtZW50Jyk7XG4gICAgZGVzY3JpYmUoJ3dpdGggYSBwbGFpbiBvYmplY3QgYXMgdGhlIDJuZCBhcmd1bWVudCcpO1xuICAgIGRlc2NyaWJlKCd3aXRoIGEgcGxhaW4gb2JqZWN0IGNvbnRhaW5pbmcgYSBgJDogbnVsbGAgYXMgdGhlIDJuZCBhcmd1bWVudCcpO1xuICAgIGRlc2NyaWJlKCd3aXRoIGEgcGxhaW4gb2JqZWN0IGNvbnRhaW5pbmcgYSBgJDogW11gIGFzIHRoZSAybmQgYXJndW1lbnQnKTtcbiAgICBkZXNjcmliZSgnd2l0aCBhIHBsYWluIG9iamVjdCBjb250YWluaW5nIGEgYCQ6IHt9YCBhcyB0aGUgMm5kIGFyZ3VtZW50Jyk7XG4gICAgZGVzY3JpYmUoJ3dpdGggYSBwbGFpbiBvYmplY3QgY29udGFpbmluZyBhIGAkOiB7Li4ue319YCBhcyB0aGUgMm5kIGFyZ3VtZW50Jyk7XG5cbiAgICBkZXNjcmliZSgnd2l0aCBhIHN0cmluZyBhcyB0aGUgMm5kIGFyZ3VtZW50Jyk7XG4gICAgZGVzY3JpYmUoJ3dpdGggYSBwbGFpbiBvYmplY3QgY29udGFpbmluZyBhIGBub2RlVHlwZWAga2V5IGFzIHRoZSAybmQgYXJndW1lbnQnKTtcbiAgICBkZXNjcmliZSgnd2l0aCBhbiBhcnJheSBhcyB0aGUgMm5kIGFyZ3VtZW50Jyk7XG4gICAgZGVzY3JpYmUoJ3dpdGggbmVzdGVkIGFycmF5cyBhcyB0aGUgMm5kIGFyZ3VtZW50Jyk7XG4gICovXG59KTtcblxufSgpKTtcbiJdfQ==