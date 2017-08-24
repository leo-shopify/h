/* eslint
   prefer-arrow-callback: off,
   space-before-function-paren: off,
   no-var: off
*/
/* global describe, it, chai */

import h from '../esm/index';

var assert = chai.assert;


describe('Examples', function () {
  describe('First example in README.md.', function () {
    it('h("section", h("h1", {class: "hero"}, "Plans"),...) → <section><h1 class="hero">Plans</h1>...', function () {
      var when = h('section',
                   h('h1', {class: 'hero'}, 'Plans'),
                   h('ol',
                     h('li', {$: {style: {color: 'grey'}}},
                       "I'm taking a ride ",
                       'with my best friend.')));
      var result = document.createElement('section');
      result.innerHTML = '<h1 class="hero">Plans</h1><ol><li style="color: grey;">' +
        'I\'m taking a ride with my best friend.</li></ol>';
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
      var when = h(h, 'a', {id: 'id'}, 'hello');
      var result = h('a', {id: 'id'}, 'hello');
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
      var when = h(result, {class: 'war'}, 'Groucho');
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
      assert.throws(function () { h(123); }, /(not a )|(in)valid/gi);
      assert.throws(function () { h({}); }, /(not a )|(in)valid/gi);
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
