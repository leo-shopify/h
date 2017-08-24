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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QXlCLFlBQVk7QUFDbkMsYUFBUywrRUFBVCxFQUEwRixZQUFZO0FBQ3BHLFNBQUcscUVBQUgsRUFBMEUsWUFBWTtBQUNwRixlQUFPLFdBQVAsQ0FBbUIsRUFBRSxJQUFGLEVBQVEsT0FBM0IsRUFBb0MsTUFBcEM7QUFDRCxPQUZEO0FBR0EsU0FBRyx3Q0FBSCxFQUE2QyxZQUFZO0FBQ3ZELGVBQU8sTUFBUCxDQUFjLFlBQVk7QUFBRSxZQUFFLEdBQUY7QUFBUyxTQUFyQyxFQUF1QyxzQkFBdkM7QUFDQSxlQUFPLE1BQVAsQ0FBYyxZQUFZO0FBQUUsWUFBRSxFQUFGO0FBQVEsU0FBcEMsRUFBc0Msc0JBQXRDO0FBQ0QsT0FIRDtBQUlELEtBUkQ7O0FBVUE7Ozs7Ozs7Ozs7OztBQWFELEdBeEJEO0FBMEJDLENBelVBLEdBQUQiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKCkge1xuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIExpZ2h0d2VpZ2h0IERPTSBlbGVtZW50IGNyZWF0aW9uIGJhc2VkIG9uIGEgc3Vic2V0IG9mIHRoZSBoeXBlcnNjcmlwdCBBUEkgYW5kXG4gKiBjb21wYXRpYmxlIHdpdGggSlNYLlxuICogQG1vZHVsZVxuICogQGF1dGhvciBsZW8tc2hvcGlmeSA8bGVvbmFyZG8ucm9qYXNAc2hvcGlmeS5jb20+XG4gKi9cblxuXG4vKipcbiAqIEB0eXBlIHtmdW5jdGlvbn1cbiAqL1xuY29uc3Qgb2JqVG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5cbi8qKlxuICogQHR5cGUge2Z1bmN0aW9ufVxuICovXG5jb25zdCB0b0FycmF5ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuXG5cbi8qKlxuICogTWluaW1hbCBEb2N1bWVudCBpbnRlcmZhY2UgbmVlZGVkIGJ5IGBoYC5cbiAqIEB0eXBlIHtPYmplY3R9IERvY3VtZW50TGlrZVxuICogQHByb3Age2Z1bmN0aW9uKHN0cmluZyl9IGNyZWF0ZUVsZW1lbnRcbiAqIEBwcm9wIHtmdW5jdGlvbigpfSBjcmVhdGVEb2N1bWVudEZyYWdtZW50XG4gKiBAcHJvcCB7ZnVuY3Rpb24oc3RyaW5nKX0gY3JlYXRlVGV4dE5vZGVcbiAqL1xuXG5cbi8qKlxuICogTWluaW1hbCBIVE1MRWxlbWVudCBpbnRlcmZhY2UgbmVlZGVkIGJ5IGBoYC5cbiAqIEB0eXBlIHtPYmplY3R9IEhUTUxFbGVtZW50TGlrZVxuICogQHByb3Age251bWJlcn0gW25vZGVUeXBlPTFdXG4gKiBAcHJvcCB7ZnVuY3Rpb24oc3RyaW5nLCAqKX0gc2V0QXR0cmlidXRlXG4gKiBAcHJvcCB7ZnVuY3Rpb24oc3RyaW5nKX0gcmVtb3ZlQXR0cmlidXRlXG4gKiBAcHJvcCB7ZnVuY3Rpb24oSFRNTEVsZW1lbnRMaWtlKX0gYXBwZW5kQ2hpbGRcbiAqIEBwcm9wIHtvYmplY3R9IFthdHRyaWJ1dGVzXVxuICogQHByb3Age2FycmF5fSBbY2hpbGRyZW5dXG4gKiBAcHJvcCB7c3RyaW5nfSBbdGFnTmFtZV1cbiAqL1xuXG5cbi8qKlxuICogTWluaW1hbCBEb2N1bWVudEZyYWdtZW50IGludGVyZmFjZSBuZWVkZWQgYnkgYGhgLlxuICogQHR5cGUge09iamVjdH0gRG9jdW1lbnRGcmFnbWVudExpa2VcbiAqIEBwcm9wIHtudW1iZXJ9IFtub2RlVHlwZT0xMV1cbiAqIEBwcm9wIHtmdW5jdGlvbihIVE1MRWxlbWVudExpa2UpfSBhcHBlbmRDaGlsZFxuICogQHByb3Age2FycmF5fSBbY2hpbGRyZW5dXG4gKi9cblxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IGNvcHkgYW4gb2JqZWN0LlxuICogQHBhcmFtIHtvYmplY3R9IHRvIFRoZSBkZXN0aW5hdGlvbi5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmcm9tIFRoZSBzb3VyY2UuXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IENvcGllcyBpbi1wbGFjZS5cbiAqL1xuZnVuY3Rpb24gZGVlcENvcHkodG8sIGZyb20pIHtcbiAgZm9yIChjb25zdCBwcm9wIGluIGZyb20pIHtcbiAgICBpZiAoZnJvbS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgaWYgKHR5cGVvZiBmcm9tW3Byb3BdID09PSAnb2JqZWN0JyAmJiBmcm9tW3Byb3BdICE9IG51bGwpIHtcbiAgICAgICAgdG9bcHJvcF0gPSB0b1twcm9wXSB8fCB7fTtcbiAgICAgICAgZGVlcENvcHkodG9bcHJvcF0sIGZyb21bcHJvcF0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdG9bcHJvcF0gPSBmcm9tW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogQHR5cGUge3N0cmluZ31cbiAqL1xuY29uc3QgREVGQVVMVF9UQUcgPSAnZGl2JztcblxuLyoqXG4gKiBDbG9zdXJlIHRvIGFsbG93IGZha2luZyBET00gYERvY3VtZW50YC5cbiAqIEBwYXJhbSB7RG9jdW1lbnRMaWtlfSBkb2MgT2JqZWN0IGltcGxlbWVudGluZyB0aGUgRE9NIGBEb2N1bWVudGAgaW50ZXJmYWNlLlxuICogQHJldHVybiB7ZnVuY3Rpb259IGBoYCBjbG9zZWQgb3ZlciBgZG9jYC5cbiAqL1xuZnVuY3Rpb24gbWFrZShkb2MpIHtcblxuICAvKipcbiAgICogQWRkIHRoZSBjaGlsZCB0byB0aGUgZWxlbWVudC4gU2tpcCBgbnVsbGAgYW5kIGB1bmRlZmluZWRgLiBSZWN1cnNlIG9uXG4gICAqIGBBcnJheWAuICBJZiB0aGUgaXRlbSBoYXMgYSBgbm9kZVR5cGVgIGtleSwgYXNzdW1lIGl0IGlzIGFuIEhUTUxFbGVtZW50IG9yXG4gICAqIERvY3VtZW50RnJhZ21lbnQgYW5kIGFkZCBpdC4gT3RoZXJ3aXNlIGNvbnZlcnQgaXQgdG8gYSBgVGV4dGAgbm9kZS5cbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudExpa2V9IGVsZW1lbnQgVGhlIHBhcmVudCBlbGVtZW50LlxuICAgKiBAcGFyYW0geyp9IGl0ZW0gVGhlIG9iamVjdCB0byBiZSBhcHBlbmRlZCBhcyBhIGNoaWxkIG9mIGVsZW1lbnQuXG4gICAqIEByZXR1cm4ge0hUTUxFbGVtZW50TGlrZX0gVGhlIG1vZGlmaWVkIHBhcmVudCBlbGVtZW50LlxuICAgKi9cbiAgZnVuY3Rpb24gYWRkQ2hpbGRyZW4oZWxlbWVudCwgaXRlbSkge1xuICAgIGlmIChpdGVtID09IG51bGwpIHsgcmV0dXJuIGVsZW1lbnQ7IH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkgeyByZXR1cm4gaXRlbS5yZWR1Y2UoYWRkQ2hpbGRyZW4sIGVsZW1lbnQpOyB9XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChpdGVtLm5vZGVUeXBlID8gaXRlbSA6IGRvYy5jcmVhdGVUZXh0Tm9kZShpdGVtKSk7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIG9yIG1vZGlmaWVzIERPTSBlbGVtZW50cy5cbiAgICogQHBhcmFtIHtzdHJpbmcgfCBIVE1MRWxlbWVudExpa2UgfCBmdW5jdGlvbn0gW3RhZz0nZGl2J10gRWl0aGVyIGEgc3RyaW5nXG4gICAqIHJlcHJlc2VudGluZyB0aGUgdHlwZSBvZiB0aGUgZWxlbWVudCB0byBjcmVhdGUsIGFuIGV4aXN0aW5nIGVsZW1lbnQgdG9cbiAgICogbW9kaWZ5LCBvciBhIGZ1bmN0aW9uIHRvIGRlbGVnYXRlIHRoZSBjb25zdHJ1Y3Rpb24uIERlZmF1bHRzIHRvIGAnZGl2J2AgaWZcbiAgICogZmFsc3kuXG4gICAqIEBwYXJhbSB7b2JqZWN0IHwgbnVsbH0gW2F0dHJpYnV0ZXM9bnVsbF0gT3B0aW9uYWwgYXR0cmlidXRlcyBvYmplY3QuXG4gICAqIEBwYXJhbSB7Li4uKn0gW2NoaWxkcmVuXSBPcHRpb25hbCBjaGlsZHJlbi5cbiAgICogQHJldHVybiB7SFRNTEVsZW1lbnRMaWtlfSBSZXN1bHRpbmcgRE9NIGVsZW1lbnQuXG4gICAqL1xuICByZXR1cm4gZnVuY3Rpb24gaCgvKiAuLi5hcmdzICovKSB7XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IHRoZSBgYXJndW1lbnRzYCBvYmplY3QgdG8gYSByZWFsIGFycmF5IHNraXBwaW5nIHRoZSBmaXJzdFxuICAgICAqIGFyZ3VtZW50LlxuICAgICAqIEB0eXBlIHthcnJheX1cbiAgICAgKi9cbiAgICBjb25zdCBhcmdzID0gdG9BcnJheS5jYWxsKGFyZ3VtZW50cywgMSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcHJlZmVyLXJlc3QtcGFyYW1zXG5cbiAgICAvKipcbiAgICAgKiBFbnN1cmUgYHRhZ2AgaXMgZGVmaW5lZC5cbiAgICAgKi9cbiAgICBjb25zdCB0YWcgPSBhcmd1bWVudHNbMF0gfHwgREVGQVVMVF9UQUc7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcHJlZmVyLXJlc3QtcGFyYW1zXG5cbiAgICAvKipcbiAgICAgKiBJZiBgdGFnYCBpcyBhIGZ1bmN0aW9uIGRlbGVnYXRlIGFuZCBiYWlsIGVhcmx5LlxuICAgICAqL1xuICAgIGlmICh0eXBlb2YgdGFnID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdGFnLmFwcGx5KG51bGwsIGFyZ3MpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHByZWZlci1zcHJlYWRcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgdGhlIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBgdGFnLm5vZGVUeXBlYCBpcyAxIGFzc3VtZSBpdCBpcyBhbiBleGlzdGluZyBlbGVtZW50LlxuICAgICAqIEVsc2UgY29lcmNlIHRvIGBzdHJpbmdgIGFuZCBjcmVhdGUgYSBuZXcgZWxlbWVudC5cbiAgICAgKi9cbiAgICBsZXQgZWxlbWVudDtcblxuICAgIGlmICh0YWcubm9kZVR5cGUgJiYgdGFnLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICBlbGVtZW50ID0gdGFnO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8taW1wbGljaXQtY29lcmNpb24sIHByZWZlci10ZW1wbGF0ZVxuICAgICAgZWxlbWVudCA9IGRvYy5jcmVhdGVFbGVtZW50KHRhZyArICcnIHx8IERFRkFVTFRfVEFHKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgdGhlIGF0dHJpYnV0ZXMuXG4gICAgICpcbiAgICAgKlxuICAgICAqIEEgdmFsdWUgcXVhbGlmaWVzIGFzIGFuIGBhdHRyaWJ1dGVzYCBvYmplY3QgaWYgaXQgaXM6IGBudWxsYCwgYE1hcGAsXG4gICAgICogYFdlYWtNYXBgIGFuZCBwbGFpbiBgT2JqZWN0YC4gIElmIHRoZSB2YWx1ZSBpcyBgT2JqZWN0YCBpdCBjYW5ub3QgY29udGFpblxuICAgICAqIGEgYG5vZGVUeXBlYCBrZXkuXG4gICAgICovXG4gICAgY29uc3QgZmlyc3QgPSBhcmdzWzBdO1xuICAgIGlmIChmaXJzdCA9PT0gbnVsbCB8fFxuICAgICAgICAob2JqVG9TdHIuY2FsbChmaXJzdCkgPT09ICdbb2JqZWN0IE9iamVjdF0nICYmICEoJ25vZGVUeXBlJyBpbiBmaXJzdCkpKSB7XG5cbiAgICAgIC8qKlxuICAgICAgICogSWYgdGhlIGZpcnN0IGVsZW1lbnQgZnJvbSB0aGUgYXJndW1lbnRzIGlzIGFuIGBhdHRyaWJ1dGVzYCB2YWx1ZSwgY29weVxuICAgICAgICogaXQgYW5kIHNldCB0aGUgb3JpZ2luYWwgdG8gbnVsbCB3aGljaCBpcyBza2lwcGVkIGJ5IHRoZSBjaGlsZHJlblxuICAgICAgICogcHJvY2Vzc29yLiBUaGlzIGlzIGZhc3RlciB0aGFuIGBBcnJheS5zaGlmdCgpYC5cbiAgICAgICAqL1xuICAgICAgY29uc3QgYXR0cmlidXRlcyA9IGZpcnN0O1xuICAgICAgYXJnc1swXSA9IG51bGw7XG5cbiAgICAgIC8qKlxuICAgICAgICogSXRlcmF0ZSBvdmVyIHRoZSBhdHRyaWJ1dGVzIGtleXMuXG4gICAgICAgKi9cbiAgICAgIGZvciAoY29uc3QgYXR0cktleSBpbiBhdHRyaWJ1dGVzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyaWJ1dGVzW2F0dHJLZXldO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiB0aGUgc3BlY2lhbCBrZXkgYCRgIGlzIGZvdW5kLCB1c2UgaXQgdG8gcG9wdWxhdGUgdGhlIGVsZW1lbnQnc1xuICAgICAgICAgKiBwcm9wZXJ0aWVzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBJZiB0aGUgdmFsdWUgb2YgdGhlIGtleSBpcyBgZnVuY3Rpb25gIHNldCBpdCBhcyBhIHByb3BlcnR5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBJZiB0aGUgdmFsdWUgb2YgdGhlIGtleSBpcyBgdW5kZWZpbmVkYCBvciBgbnVsbGAgcmVtb3ZlIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICogZnJvbSB0aGUgZWxlbWVudC4gT3RoZXJ3aXNlIGFkZCBpdC5cbiAgICAgICAgICovXG4gICAgICAgIGlmIChhdHRyS2V5ID09PSAnJCcpIHtcbiAgICAgICAgICBkZWVwQ29weShlbGVtZW50LCBhdHRyVmFsKTtcbiAgICAgICAgfSBlbHNlIGlmIChhdHRyVmFsID09IG51bGwpIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShhdHRyS2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyS2V5LCBhdHRyVmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSByZW1haW5pbmcgZWxlbWVudHMgb2YgYHJlc3RgIGFyZSB0aGUgY2hpbGRyZW4uIEFkZCB0aGVtIHRvIHRoZVxuICAgICAqIGVsZW1lbnQuXG4gICAgICovXG4gICAgcmV0dXJuIGFyZ3MucmVkdWNlKGFkZENoaWxkcmVuLCBlbGVtZW50KTtcbiAgfTtcbn1cblxuLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbnZhciBoID0gbWFrZShkb2N1bWVudCk7XG5cbi8qIGVzbGludFxuICAgcHJlZmVyLWFycm93LWNhbGxiYWNrOiBvZmYsXG4gICBzcGFjZS1iZWZvcmUtZnVuY3Rpb24tcGFyZW46IG9mZixcbiAgIG5vLXZhcjogb2ZmXG4qL1xuLyogZ2xvYmFsIGRlc2NyaWJlLCBpdCwgY2hhaSAqL1xuXG52YXIgYXNzZXJ0ID0gY2hhaS5hc3NlcnQ7XG5cblxuZGVzY3JpYmUoJ0V4YW1wbGVzJywgZnVuY3Rpb24gKCkge1xuICBkZXNjcmliZSgnRmlyc3QgZXhhbXBsZSBpbiBSRUFETUUubWQuJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdoKFwic2VjdGlvblwiLCBoKFwiaDFcIiwge2NsYXNzOiBcImhlcm9cIn0sIFwiUGxhbnNcIiksLi4uKSDihpIgPHNlY3Rpb24+PGgxIGNsYXNzPVwiaGVyb1wiPlBsYW5zPC9oMT4uLi4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgd2hlbiA9IGgoJ3NlY3Rpb24nLFxuICAgICAgICAgICAgICAgICAgIGgoJ2gxJywge2NsYXNzOiAnaGVybyd9LCAnUGxhbnMnKSxcbiAgICAgICAgICAgICAgICAgICBoKCdvbCcsXG4gICAgICAgICAgICAgICAgICAgICBoKCdsaScsIHskOiB7c3R5bGU6IHtjb2xvcjogJ2dyZXknfX19LFxuICAgICAgICAgICAgICAgICAgICAgICBcIkknbSB0YWtpbmcgYSByaWRlIFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAnd2l0aCBteSBiZXN0IGZyaWVuZC4nKSkpO1xuICAgICAgdmFyIHJlc3VsdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlY3Rpb24nKTtcbiAgICAgIHJlc3VsdC5pbm5lckhUTUwgPSAnPGgxIGNsYXNzPVwiaGVyb1wiPlBsYW5zPC9oMT48b2w+PGxpIHN0eWxlPVwiY29sb3I6IGdyZXk7XCI+JyArXG4gICAgICAgICdJXFwnbSB0YWtpbmcgYSByaWRlIHdpdGggbXkgYmVzdCBmcmllbmQuPC9saT48L29sPic7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwod2hlbi5vdXRlckhUTUwsIHJlc3VsdC5vdXRlckhUTUwpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuXG5cbmRlc2NyaWJlKCdBUEknLCBmdW5jdGlvbiAoKSB7XG4gIGRlc2NyaWJlKCdDYWxsaW5nIGggd2l0aCBubyBhcmd1bWVudHMgb3IgYSBmYWxzeSB2YWx1ZSByZXR1cm5zIGFuIEhUTUxEaXZFbGVtZW50LicsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnaCggKSDihpIgPGRpdi8+JywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHdoZW4gPSBoKCk7XG4gICAgICB2YXIgcmVzdWx0ID0gJ0RJVic7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwod2hlbi50YWdOYW1lLCByZXN1bHQpO1xuICAgIH0pO1xuICAgIGl0KCdoKFwiXCIpIOKGkiA8ZGl2Lz4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgd2hlbiA9IGgoJycpO1xuICAgICAgdmFyIHJlc3VsdCA9ICdESVYnO1xuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHdoZW4udGFnTmFtZSwgcmVzdWx0KTtcbiAgICB9KTtcbiAgICBpdCgnaChudWxsKSDihpIgPGRpdi8+JywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHdoZW4gPSBoKG51bGwpO1xuICAgICAgdmFyIHJlc3VsdCA9ICdESVYnO1xuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHdoZW4udGFnTmFtZSwgcmVzdWx0KTtcbiAgICB9KTtcbiAgICBpdCgnT3RoZXIgZmFsc3kgdmFsdWVzIOKGkiA8ZGl2Lz4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgZXhwZWN0ID0gJ0RJVic7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoaChmYWxzZSkudGFnTmFtZSwgZXhwZWN0KTtcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChoKDApLnRhZ05hbWUsIGV4cGVjdCk7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoaChOYU4pLnRhZ05hbWUsIGV4cGVjdCk7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoaChbXSkudGFnTmFtZSwgZXhwZWN0KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0NhbGxpbmcgaCB3aXRoIGEgc3RyaW5nIGFzIHRoZSBmaXJzdCBhcmd1bWVudCByZXR1cm5zIGFuIEhUTUxFbGVtZW50IHdpdGggdGhhdCB0YWcuJywgZnVuY3Rpb24gKCkge1xuICAgIC8vIGgoc3RyaW5nKVxuICAgIGl0KCdoKFwiYVwiKSDihpIgPGEvPicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciB3aGVuID0gaCgnYScpO1xuICAgICAgdmFyIHJlc3VsdCA9ICdBJztcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh3aGVuLnRhZ05hbWUsIHJlc3VsdCk7XG4gICAgfSk7XG4gICAgaXQoJ2goXCJteS1jdXN0b20tdGFnXCIpIOKGkiA8bXktY3VzdG9tLXRhZy8+JywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHdoZW4gPSBoKCdteS1jdXN0b20tdGFnJyk7XG4gICAgICB2YXIgcmVzdWx0ID0gJ01ZLUNVU1RPTS1UQUcnO1xuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHdoZW4udGFnTmFtZSwgcmVzdWx0KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0NhbGxpbmcgaCB3aXRoIGEgZnVuY3Rpb24gYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHJldHVybnMgdGhlIHJlc3VsdCBvZiBkZWxlZ2F0aW5nIHRoZSBhcmd1bWVudHMgdG8gdGhlIGZ1bmN0aW9uLicsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnaChoLCBcImFcIiwge2lkOiBcImlkXCJ9LCBcImhlbGxvXCIpIOKGkiA8YSBpZD1cImlkXCI+aGVsbG88L2E+JywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHdoZW4gPSBoKGgsICdhJywge2lkOiAnaWQnfSwgJ2hlbGxvJyk7XG4gICAgICB2YXIgcmVzdWx0ID0gaCgnYScsIHtpZDogJ2lkJ30sICdoZWxsbycpO1xuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHdoZW4udGFnTmFtZSwgcmVzdWx0LnRhZ05hbWUpO1xuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHdoZW4uaWQsIHJlc3VsdC5pZCk7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwod2hlbi5maXJzdENoaWxkLm5vZGVWYWx1ZSwgcmVzdWx0LmZpcnN0Q2hpbGQubm9kZVZhbHVlKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0NhbGxpbmcgaCB3aXRoIGFuIEhUTUxlbGVtZW50IGFzIHRoZSBmaXJzdCBhcmd1bWVudCByZXR1cm5zIHRoZSBzYW1lIEhUTUxFbGVtZW50LicsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnaChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiKSkg4oaSIDxzZWN0aW9uLz4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VjdGlvbicpO1xuICAgICAgdmFyIHdoZW4gPSBoKHJlc3VsdCk7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwod2hlbiwgcmVzdWx0KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0NhbGxpbmcgaCB3aXRoIGFuIEhUTUxlbGVtZW50IGFuZCBhdHRyaWJ1dGVzIGFuZCBjaGlsZHJlbiByZXR1cm5zIHRoZSBtb2RpZmllZCBIVE1MRWxlbWVudC4nLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ2goZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIiksIHtcImNsYXNzXCI6IFwid2FyXCJ9LCBcIkdyb3VjaG9cIikg4oaSIDxhIGNsYXNzPVwid2FyXCI+R3JvdWNobzwvYT4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgdmFyIHdoZW4gPSBoKHJlc3VsdCwge2NsYXNzOiAnd2FyJ30sICdHcm91Y2hvJyk7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwod2hlbi50YWdOYW1lLCByZXN1bHQudGFnTmFtZSk7XG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwod2hlbi5pZCwgcmVzdWx0LmlkKTtcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh3aGVuLmZpcnN0Q2hpbGQubm9kZVZhbHVlLCByZXN1bHQuZmlyc3RDaGlsZC5ub2RlVmFsdWUpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuXG5cbmRlc2NyaWJlKCdDb3JuZXIgY2FzZXMnLCBmdW5jdGlvbiAoKSB7XG4gIGRlc2NyaWJlKCdDYWxsaW5nIGggd2l0aCBhIGZpcnN0IGFyZ3VtZW50IG90aGVyIHRoYW4gYSBzdHJpbmcsIGZ1bmN0aW9uIG9yIEhUTUxFbGVtZW50OicsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnUmV0dXJucyBhbiBIVE1MRWxlbWVudCB3aXRoIHRoZSB2YWx1ZSBjb2VyY2VkIHRvIGEgc3RyaW5nIGFzIGEgdGFnLicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChoKHRydWUpLnRhZ05hbWUsICdUUlVFJyk7XG4gICAgfSk7XG4gICAgaXQoJ1Rocm93cyBhbiBlcnJvciBpZiB0aGUgdGFnIGlzIGludmFsaWQuJywgZnVuY3Rpb24gKCkge1xuICAgICAgYXNzZXJ0LnRocm93cyhmdW5jdGlvbiAoKSB7IGgoMTIzKTsgfSwgLyhub3QgYSApfChpbil2YWxpZC9naSk7XG4gICAgICBhc3NlcnQudGhyb3dzKGZ1bmN0aW9uICgpIHsgaCh7fSk7IH0sIC8obm90IGEgKXwoaW4pdmFsaWQvZ2kpO1xuICAgIH0pO1xuICB9KTtcblxuICAvKlxuICAgIGRlc2NyaWJlKCd3aXRoIG51bGwgYXMgdGhlIDJuZCBhcmd1bWVudCcpO1xuICAgIGRlc2NyaWJlKCd3aXRoIGEgcGxhaW4gb2JqZWN0IGFzIHRoZSAybmQgYXJndW1lbnQnKTtcbiAgICBkZXNjcmliZSgnd2l0aCBhIHBsYWluIG9iamVjdCBjb250YWluaW5nIGEgYCQ6IG51bGxgIGFzIHRoZSAybmQgYXJndW1lbnQnKTtcbiAgICBkZXNjcmliZSgnd2l0aCBhIHBsYWluIG9iamVjdCBjb250YWluaW5nIGEgYCQ6IFtdYCBhcyB0aGUgMm5kIGFyZ3VtZW50Jyk7XG4gICAgZGVzY3JpYmUoJ3dpdGggYSBwbGFpbiBvYmplY3QgY29udGFpbmluZyBhIGAkOiB7fWAgYXMgdGhlIDJuZCBhcmd1bWVudCcpO1xuICAgIGRlc2NyaWJlKCd3aXRoIGEgcGxhaW4gb2JqZWN0IGNvbnRhaW5pbmcgYSBgJDogey4uLnt9fWAgYXMgdGhlIDJuZCBhcmd1bWVudCcpO1xuXG4gICAgZGVzY3JpYmUoJ3dpdGggYSBzdHJpbmcgYXMgdGhlIDJuZCBhcmd1bWVudCcpO1xuICAgIGRlc2NyaWJlKCd3aXRoIGEgcGxhaW4gb2JqZWN0IGNvbnRhaW5pbmcgYSBgbm9kZVR5cGVgIGtleSBhcyB0aGUgMm5kIGFyZ3VtZW50Jyk7XG4gICAgZGVzY3JpYmUoJ3dpdGggYW4gYXJyYXkgYXMgdGhlIDJuZCBhcmd1bWVudCcpO1xuICAgIGRlc2NyaWJlKCd3aXRoIG5lc3RlZCBhcnJheXMgYXMgdGhlIDJuZCBhcmd1bWVudCcpO1xuICAqL1xufSk7XG5cbn0oKSk7XG4iXX0=