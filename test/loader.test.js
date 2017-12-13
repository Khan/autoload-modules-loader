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

function createCompiler(plugins) {
    return webpack({
        bail: true,
        cache: false,
        entry: {
            foo: path.resolve(__dirname, 'fixtures/foo.js'),
        },
        output: {
            path: `/dist`,
            filename: '[name].js',
            chunkFilename: '[name].js',
        },
        module: {
            loaders: [{
                test: /\.js[x]?$/,
                loader: `autoload-plugins-loader?${plugins.join(',')}`,
            }],
        },
        resolveLoader: {
            alias: {
                'autoload-plugins-loader': path.resolve(__dirname, "../"),
            },
        },
    });
}

describe('autoloader-plugins-loader', () => {
    it('should work with a single plugin', () => {
        const compiler = createCompiler(['test/fixtures/bar.js']);
        const fs = new MemoryFileSystem();
        compiler.outputFileSystem = fs;

        return compile(compiler).then(() => {
            const foo = fs.readFileSync("/dist/foo.js").toString();
            expect(foo).toContain(
                '/*** REQUIRES FROM autoload-plugins-loader ***/');
            expect(foo).toContain('__webpack_require__(0);   // test/fixtures/bar.js');
        });
    });

    it('should work with multiple plugins', () => {
        const compiler = createCompiler(
            ['test/fixtures/bar.js', 'test/fixtures/baz.js']);
        const fs = new MemoryFileSystem();
        compiler.outputFileSystem = fs;

        return compile(compiler).then(() => {
            const foo = fs.readFileSync("/dist/foo.js").toString();
            expect(foo).toContain(
                '/*** REQUIRES FROM autoload-plugins-loader ***/');
            expect(foo).toContain('__webpack_require__(0);   // test/fixtures/bar.js');
            expect(foo).toContain('__webpack_require__(1);   // test/fixtures/baz.js');
        });
    });

});
