import mocha from 'mocha';
import chai from 'chai';
import make from '../src/h';

const {describe, it} = mocha;
const {assert} = chai;


/**
 * Doubles
 */
class NodeLike {
  appendChild(child) {
    this.children.push(child);
    return child;
  }
}

const VALID_TAG_NAME = /^(:|_|[A-Z]|[a-z])+(:|_|[A-Z]|[a-z]|-|.|[0-9])*$/;

class HTMLElementLike extends NodeLike {
  constructor(tag) {
    if (!VALID_TAG_NAME.test(tag)) {
      throw new Error('InvalidCharacterError');
    }
    super();
    this.nodeType = 1;
    this.tagName = tag.toUpperCase();
    this.attributes = {};
    this.children = [];
  }

  setAttribute(key, val) {
    this.attributes[key] = val;
  }

  removeAttribute(key) {
    delete this.attributes[key];
  }
}


class DocumentFragmentLike extends NodeLike {
  constructor() {
    super();
    this.nodeType = 11;
    this.children = [];
  }
}

const DocumentLike = Object.freeze({
  createElement(tag) {
    return new HTMLElementLike(tag);
  },

  createDocumentFragment() {
    return new DocumentFragmentLike();
  },

  createTextNode(str) { return str; },
});


/**
 * tests
 */
describe('Calling h', () => {
  describe('in a fake Document environment', () => {
    const h = make(DocumentLike);

    describe('with no arguments, or a falsy value', () => {
      it('returns an HTMLDivElement.', () => {
        const expected = 'DIV';
        assert.strictEqual(h().tagName, expected);
        assert.strictEqual(h('').tagName, expected);
        assert.strictEqual(h(null).tagName, expected);
        assert.strictEqual(h(NaN).tagName, expected);
        assert.strictEqual(h([]).tagName, expected);
      });
    });

    describe('with a string as the first argument', () => {
      it('returns an HTMLElement with that tag.', () => {
        assert.strictEqual(h('a').tagName, 'A');
        assert.strictEqual(h('made-up').tagName, 'MADE-UP');
      });
    });

    describe('with a function as the first argument', () => {
      it('delegates the arguments to the function.', () => {
        assert.strictEqual(h(h).tagName, 'DIV');
        const expect = h('a', {id: 'id'}, 'hello');
        assert.deepEqual(h(h, 'a', {id: 'id'}, 'hello'), expect);
      });
    });

    describe('with an HTMLelement as the first argument', () => {
      it('returns the same HTMLElement.', () => {
        const expected = new HTMLElementLike('section');
        assert.strictEqual(h(expected), expected);
      });
    });

    describe('with a first argument other than a string, function or HTMLElement', () => {
      it('returns an HTMLElement with the value coerced to a string as a tag.', () => {
        assert.strictEqual(h(true).tagName, 'TRUE');
      });
      it('throws an error if the tag is invalid.', () => {
        assert.throws(() => { h(123); }, /error/gi);
        assert.throws(() => { h({}); }, /error/gi);
      });
    });
  });
});
