const path = require('path');
const webpack = require('webpack');
const MemoryFileSystem = require('memory-fs');

function compile(compiler) {
    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                return reject(err);
            }
            resolve(stats);
        });
    });
}

function createCompiler(entry) {
    return webpack({
        bail: true,
        cache: false,
        entry: entry,
        output: {
            path: `/dist`,
            filename: '[name].js',
            chunkFilename: '[name].js',
        },
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
        resolveLoader: {
            alias: {
                'autoload-plugins-loader': path.resolve(__dirname, "../"),
            },
        },
    });
}

describe('autoloader-plugins-loader', () => {
    it('should work with multiple modules that have plugins',  () => {
        const compiler = createCompiler({
            foo: path.resolve(__dirname, 'fixtures/foo.js'),
        });
        const fs = new MemoryFileSystem();
        compiler.outputFileSystem = fs;
        return compile(compiler).then(() => {
            const foo = fs.readFileSync("/dist/foo.js").toString();

            expect(foo).toContain('/*** REQUIRES FROM autoload-modules-loader ***/');
            expect(foo).toContain('__webpack_require__(4); // dep-a-plugin-1.js');
            expect(foo).toContain('__webpack_require__(5); // dep-a-plugin-2.js');
            expect(foo).toContain('__webpack_require__(6); // dep-b-plugin.js');
        });
    });

    it('should work with a single module with a plugin',  () => {
        const compiler = createCompiler({
            bar: path.resolve(__dirname, 'fixtures/bar.js'),
        });
        const fs = new MemoryFileSystem();
        compiler.outputFileSystem = fs;
        return compile(compiler).then(() => {
            const bar = fs.readFileSync("/dist/bar.js").toString();

            expect(bar).toContain('/*** REQUIRES FROM autoload-modules-loader ***/');
            expect(bar).toContain('__webpack_require__(3); // dep-b-plugin.js');
            expect(bar).not.toContain('// dep-a-plugin-1.js');
            expect(bar).not.toContain('// dep-a-plugin-2.js');
        });
    });

    it('should not affect modules that without plugins',  () => {
        const compiler = createCompiler({
            baz: path.resolve(__dirname, 'fixtures/baz.js'),
        });
        const fs = new MemoryFileSystem();
        compiler.outputFileSystem = fs;
        return compile(compiler).then(() => {
            const baz = fs.readFileSync("/dist/baz.js").toString();

            expect(baz).not.toContain('/*** REQUIRES FROM autoload-modules-loader ***/');
        });
    });

    it('should work with other loaders, e.g. handlebars-loader',  () => {
        const compiler = createCompiler({
            qux: path.resolve(__dirname, 'fixtures/qux.js'),
        });
        const fs = new MemoryFileSystem();
        compiler.outputFileSystem = fs;
        return compile(compiler).then(() => {
            const qux = fs.readFileSync("/dist/qux.js").toString();

            expect(qux).toContain('/*** REQUIRES FROM autoload-modules-loader ***/');
            expect(qux).toContain('// handlebars-extras.js');
        });
    });
});
