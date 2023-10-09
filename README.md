# Route Corrector Middleware for Express.js

A middleware for Express.js applications that captures potential typos in your
route paths and redirects (or suggests) the correct path to the user using
the Levenshtein string similarity algorithm.

## Usage

### Basic Setup

In the following example, the user will be redirected to `/about` if they visit
`/abotu` or `/abuot`. It will also respect URL parameters, so `/prodcts/1/ifo` will redirect to `/products/1/info`.

```ts
import routeCorrector from 'route-corrector';

app.use(routeCorrector(app));

app.get('/about', (req, res) => res.send('About Page'));
app.get('/products/:productId/info', (req, res) => res.send(`Product ${req.params.productId}`));


app.listen(3000);
```

### With Custom Redirects

If you're aware of commonly mistyped paths or have restructured your application
and want to manually specify typo redirects, use custom redirects:

```ts
import routeCorrector from 'route-corrector';

app.use(routeCorrector(app, {
    customRedirects: {
        '/me': '/dashboard'
    }
}));
```

### Whitelist & Blacklist

For granular control over which routes should be processed by the middleware,
use the whitelist (to exclusively include paths) and blacklist (to exclude
paths):

```ts
import routeCorrector from 'route-corrector';

app.use(routeCorrector(app, {
    whitelist: ['/about', '/contact'],
    blacklist: ['/admin']
}));
```

### Suggest Mode

In suggest mode, the middleware doesn't redirect. Instead, it sets the suggested
route in `res.locals.suggestedRoute`.

```ts
import routeCorrector from 'route-corrector';

app.use(typoRedirectMiddleware(app, {
    suggestOnly: true
}));

app.use((req, res, next) => {
    if (res.locals.suggestedRoute) {
        res.send(`Did you mean ${res.locals.suggestedRoute}?`);
    } else {
        next();
    }
});
```

## API

### typoRedirectMiddleware(app, options?)
Creates and returns the middleware.

#### app
Type: `Express.Application`

#### options
Type: `object`

##### threshold
Type: `number`

Define the distance threshold below which a typo suggestion/redirect occurs. For
Levenshtein, a common value is around `2` or `3`, depending on the average
length of your routes.

Default: 
- Levenshtein: `2`

##### customRedirects
Type: `Record<string, string>`

A map of mistyped paths to their correct paths.

##### whitelist
Type: `string[]`

List of paths that should only be processed by the middleware.

##### blacklist
Type: `string[]`

List of paths that should be skipped by the middleware.

##### suggestOnly
Type: `boolean`

When set to true, the middleware won't redirect but instead set the suggested
path in `res.locals.suggestedRoute`.


