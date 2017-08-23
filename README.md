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


## jsx

Even if you are not using react you can still take advantage of *jsx* syntax by
using a compiler that transforms jsx into `h` calls, like
Babel's
[React JSX transform](https://babeljs.io/docs/plugins/transform-react-jsx/)
plugin or [Bublé](https://buble.surge.sh/guide/#jsx.).


### Example using babel

1. Create a file using jsx and save it as `sample.js`:

    ```js
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

2.  Install babel and *React JSX transform* plugin.

        npm install --save-dev babel-cli babel-plugin-transform-react-jsx

3.  Add a `babel` section to `package.json`:

    ```json
    "babel": {
      "plugins": ["transform-react-jsx"]
    }
    ```

4.  Compile the script to standard JavaScript:

        ./node_modules/.bin/babel sample.js > out.js

5.  `out.js`:

    ```js
    /** @jsx h */

    import h from '@leo-shopify/h';

    function Title(attr, title) {
      return h(
        "h1",
        { "class": "{attr.class}" },
        title.toUpperCase()
      );
    }

    function Plan(attr, text, link) {
      return h(
        "ol",
        null,
        h(
          "li",
          null,
          text,
          " ",
          link
        )
      );
    }

    function Email(attr, name) {
      return h(
        "a",
        { href: `mailto:${attr.email}` },
        name
      );
    }

    const body = h(
      "section",
      null,
      h(
        Title,
        { "class": "hero" },
        "Plan"
      ),
      h(
        Plan,
        null,
        "I'm taking a ride",
        h(
          Email,
          { email: "lou@example.com" },
          "with my best friend"
        )
      )
    );

    document.body.appendChild(body);
    ```
