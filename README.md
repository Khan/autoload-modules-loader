# autoload-modules-load

This is a webpack loader that automatically load additional modules whenever a
particular module is loaded.

This is usefully for automatically loading plugins for libraries like jquery
without having to manually require the plugins before before using them.

Adapted from https://github.com/webpack-contrib/exports-loader.

# Configuration

```
module: {
    rules: [
        {
            test: /\.js[x]?$/,
            use: [
                {
                    loader: 'autoload-plugins-loader',
                    options: {
                        moduleToPluginsMap: {
                            [path.resolve(__dirname, 'fixtures/dep-a.js')]: [
                                path.resolve(__dirname, 'fixtures/dep-a-plugin-1.js'),
                                path.resolve(__dirname, 'fixtures/dep-a-plugin-2.js'),
                            ],
                            [path.resolve(__dirname, 'fixtures/dep-b.js')]: [
                                path.resolve(__dirname, 'fixtures/dep-b-plugin.js'),
                            ],
                        },
                    },
                },
            ],
        },
        {
            test: /\.handlebars$/,
            use: [
                {
                    loader: 'autoload-plugins-loader',
                    options: {
                        moduleToPluginsMap: {
                            [require.resolve('handlebars/runtime')]: [
                                path.resolve(__dirname, 'fixtures/handlebars-extras.js'),
                            ],
                        },
                    },
                },
                {
                    loader: 'handlebars-loader',
                },
            ],
        },
    ],
},
```

Notes:
- all paths must be absolute paths.
- must be run after transpiling `import` statements to `require`s.
