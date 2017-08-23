# `h`

Lightweight DOM element creation based on a subset of the hyperscript API and
compatible with JSX.

```js
import h from '@leo-shopify/h';

var element = h('section',
                h('h1', {'class': 'hero'}, 'Plans'),
                h('ol',
                  h('li', {$: {style: {color: 'grey'}}},
                    "I'm taking a ride ",
                    'with my best friend.')));

document.body.appendChild(element);
```


## Features

- DOM *HTMLElement*s can be passed as a first argument or as children, enabling
  the modification of existing elements.

- Compatible with [jsx](#jsx). The first argument of `h` can be a *function*
  that accepts the rest of the arguments, enabling *react-style components*.
  
- Explicit distinction between DOM *attributes* and *properties*.  
  The optional second argument can be a plain JavaScript *Object*, a *Map*, or a
  *WeakMap*. Its members are added to the *HTMLElement* as attributes (or
  removed if the value is `null` or `undefined`).  
  If a member with a `$` key is included its values are recursively copied to the
  *HTMLElement* as properties, allowing `style` properties as objects, *event
  properties* and giving explicit control to the programmer.
  
- Lightweight. Less than `1kb` minified. No dependencies.

- Works in any *Ecmascript 5* compatible browser.


## Non-features and caveats

- The shorthand syntax for *classes* and *id*s using *css selectors* has been
  omitted.
  
- JavaScript objects with a `nodeType` property are considered DOM *Node*s.

- Minimal error detection.


## Instalation

`npm install --save @leo-shopify/h` using *npm*.

`yarn add @leo-shopify/h` using *yarn*.


## Usage

Import it to your script if you use *es6 modules*:

```js
import h from '@leo-shopify/h';
```

Or require it if using *commonjs modules*:

```js
var h = require('@leo-shopify/h');
```


## jsx

Even if you are not using react you can still take advantage of *jsx* syntax by
using a compiler that transforms jsx into `h` calls, like
Babel's
[React JSX transform](https://babeljs.io/docs/plugins/transform-react-jsx/)
plugin or [Bublé](https://buble.surge.sh/guide/#jsx.).


### Example using babel

1. Create a file using jsx and save it as `sample.js`:

   ```jsx
   /** @jsx h */
   
   import h from '@leo-shopify/h';
   
   function Title(attr, title) {
     return <h1 class="{attr.class}">{title.toUpperCase()}</h1>;
   }
   
   function Plan(attr, text, link) {
     return (<ol>
             <li>{text} {link}</li>
             </ol>);
   }
   
   function Email(attr, name) {
     return <a href={`mailto:${attr.email}`}>{name}</a>;
   }
   
   const body = (<section>
                   <Title class="hero">Plan</Title>
                   <Plan>
                     I'm taking a ride
                     <Email email="lou@example.com">with my best friend</Email>
                  </Plan>
                </section>);
   
   document.body.appendChild(body);
   ```

2.  Install *babel* and the *React JSX transform* plugin.

        npm install --save-dev babel-cli babel-plugin-transform-react-jsx

3.  Add a `babel` section to `package.json`:

    ```js
    "babel": {
      "plugins": ["transform-react-jsx"]
    }
    ```

4.  Compile the script to standard JavaScript:

        ./node_modules/.bin/babel sample.js
