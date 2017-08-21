# jsx without react

Even if react is not used in a project you can still take advantage of [jsx](https://babeljs.io/docs/plugins/transform-react-jsx/)
syntax if you are using [babel](https://babeljs.io/).


## Sample

Fist we have to tell babel what function to use to compile jsx:

    /** @jsx h */

Then we can start using jsx syntax and in this case output to DOM:

    function Title(attr, str) {
      return <h1>{str.toUpperCase()}</h1>;
    }
    
    function Author(attr, ...name) {
      return <a href={`mailto:${attr.email}`}>{name}</a>;
    }
    
    const body = (<header>
                <Title>Santa Maradona</Title>
                <Author email="mano.negra@example.com">Mano <strong>Negra</strong></Author>
                </header>);
    
    document.body.appendChild(body);

While babel can compile the script as is, a runtime definition of `h` is
needed:

    function h(node, attributes, ...children) {
      if (typeof node === 'function') {
        return node(attributes, ...children);
      }
    
      let element;
    
      if (typeof node === 'string') {
        element = document.createElement(node);
      } else if (typeof node.appendChild === 'function') {
        element = node;
      } else {
        throw new TypeError('node must be a String or an object that implements appendChild');
      }
    
      if (attributes) {
        Object.keys(attributes).forEach(k => k === '$'
                                      ? Object.assign(element, attributes.$)
                                      : element.setAttribute(k, attributes[k]) );
      }
    
      return children == null ? element : children.reduce(recurse, element);
    }
    
    function recurse(node, item) {
      let child;
      if (Array.isArray(item)) { child = item.reduce(recurse, document.createDocumentFragment()); }
      else if (item.nodeType) { child = item; }
      else { child = document.createTextNode(item); }
      node.appendChild(child);
      return node;
    }


## Setup

Install [nodejs](https://nodejs.org/en/) if you don't have it already.
In this document the versions used are:

-   [nodejs](https://nodejs.org/en/): `v8.1.4`
-   [npm](https://www.npmjs.com/): `5.3.0`

In an empty directory:

1.  Create an npm package:
    
        npm init --yes

2.  Create a directory for the source code:
    
        mkdir src

3.  Install babel:
    
        npm install --save-dev babel-cli

4.  Add a build script to `package.json`:
    
        "scripts": {
          "build": "babel src -d lib"
        }
5.  Install *React JSX transform*:
    
        npm install --save-dev babel-plugin-transform-react-jsx

6.  Create `.babelrc` configuration file:
    
        {
          "plugins": ["transform-react-jsx"]
        }
7.  Save the sample scripts as `src/sample.js`.
8.  Compile the script:
    
        npm run build


## All together

    cat lib/sample.js

    <!doctype html>
    <title>h</title>
    <body>
      <script>
        /** @jsx h */
    
        function h(node, attributes, ...children) {
          if (typeof node === 'function') {
          return node(attributes, ...children);
          }
    
          let element;
    
          if (typeof node === 'string') {
          element = document.createElement(node);
          } else if (typeof node.appendChild === 'function') {
          element = node;
          } else {
          throw new TypeError('node must be a String or an object that implements appendChild');
          }
    
          if (attributes) {
          Object.keys(attributes).forEach(k => k === '$' ? Object.assign(element, attributes.$) : element.setAttribute(k, attributes[k]));
          }
    
          return children == null ? element : children.reduce(recurse, element);
        }
    
        function recurse(node, item) {
          let child;
          if (Array.isArray(item)) {
          child = item.reduce(recurse, document.createDocumentFragment());
          } else if (item.nodeType) {
          child = item;
          } else {
          child = document.createTextNode(item);
          }
          node.appendChild(child);
          return node;
        }
    
        function Title(attr, str) {
          return h(
          'h1',
          null,
          str.toUpperCase()
          );
        }
    
        function Author(attr, ...name) {
          return h(
          'a',
          { href: `mailto:${attr.email}` },
          name
          );
        }
    
        const body = h(
          'header',
          null,
          h(
          Title,
          null,
          'Santa Maradona'
          ),
          h(
          Author,
          { email: 'mano.negra@example.com' },
          'Mano ',
          h(
            'strong',
            null,
            'Negra'
          )
          )
        );
    
        document.body.appendChild(body);
      </script>
    </body>


### Tested on

<table border="2" cellspacing="0" cellpadding="6" rules="groups" frame="hsides">


<colgroup>
<col  class="org-left" />

<col  class="org-left" />
</colgroup>
<tbody>
<tr>
<td class="org-left">Firefox 54</td>
<td class="org-left">✅</td>
</tr>


<tr>
<td class="org-left">Safari 10</td>
<td class="org-left">✅</td>
</tr>


<tr>
<td class="org-left">Chrome 59</td>
<td class="org-left">✅</td>
</tr>
</tbody>
</table>


# An `el` function with better ergonomics

    function el(node, ...args) {
      let attributes;
      let children;
    
      if (args.length < 1) { return h(node, null); }
      let a = args.shift();
      let b = args;
    
      if (a == null) {
        attributes = null;
        children = b;
      } else if (a.nodeType
               || typeof a === 'string'
               || typeof a === 'number'
               || typeof a === 'boolean') {
        attributes = null;
        children = [a, ...b];
      } else if (Array.isArray(a)) {
        attributes = null;
        children = a;
      } else {
        attributes = a;
        children = b;
      }
      return h(node, attributes, ...children);
    }

