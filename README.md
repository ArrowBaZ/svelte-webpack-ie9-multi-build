# svelte app

## Get started

Install the dependencies...

```bash
cd svelte-webpack-ie9-multi-build
npm i
```

...then start [Webpack](https://webpack.js.org/):

```bash
npm run serve
```

Navigate to [localhost:8080](http://localhost:8080). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

By default, the server will only respond to requests from localhost. To allow connections from other computers, edit the `webpack-dev-server` commands in package.json to include the option `--host 0.0.0.0`.


## Building and running in production mode

To create an optimised version of the app:

```bash
npm run build
```
