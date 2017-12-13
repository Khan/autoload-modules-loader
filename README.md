# autoload-modules-load

This is a webpack loader that automatically load additional modules whenever a
particular module is loaded.

This is usefully for automatically loading plugins for libraries like jquery
without having to manually require the plugins before before using them.

Adapted from https://github.com/webpack-contrib/exports-loader.

# Configuration

```
loaders: [{
    test: /\.js[x]?$/,
    loader: `autoload-plugins-loader?path/to/foo.js`,
}],
```

Paths are relative to `__dirname`.
