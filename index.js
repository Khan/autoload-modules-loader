/**
 * Automatically load additional modules whenever a particular module is loaded.
 *
 * This is usefully for automatically loading plugins for libraries like jquery
 * without having to manually require the plugins before before using them.
 *
 * Adapted from https://github.com/webpack-contrib/exports-loader.
 */
const path = require("path");
const loaderUtils = require("loader-utils");
const SourceNode = require("source-map").SourceNode;
const SourceMapConsumer = require("source-map").SourceMapConsumer;
const matchAll = require('match-all');
const promisify = require("util").promisify;

const FOOTER = "/*** REQUIRES FROM autoload-modules-loader ***/\n";

const REQUIRE_RE = /\brequire\s*\(\s*[\'"]([^\'"]*)[\'"]\s*\)/g;

module.exports = function(content, sourceMap) {
    if (this.cacheable) {
        this.cacheable();
    }

    const resolve = promisify(this.resolve);

    // Find all 'require' statements
    const reqs = matchAll(content, REQUIRE_RE).toArray();
    const reqsToAdd = [];

    // Use async mode b/c we calling this.resolve() is async
    const callback = this.async();

    Promise.all(reqs.map(req => resolve(this.context, req))).then(resolvedReqs => {
        const requires = [];
        const {moduleToPluginsMap} = this.query;

        for (const resolvedReq of resolvedReqs) {
            if (resolvedReq in moduleToPluginsMap) {
                // If the absolute path for any of those require statements
                // matches a key in moduleToPluginsMap, add 'require' calls
                // for each of the "plugins" to the list of requires we're
                // going to append to the file being loaded.
                const plugins = moduleToPluginsMap[resolvedReq];
                for (const plugin of plugins) {
                    const relPath = path.relative(path.dirname(this.resource), plugin);
                    requires.push(`require("${plugin}"); // ${relPath}`);
                }
            }
        }

        const error = null;

        // Append 'require' calls to the file if there are any.
        if (sourceMap) {
            if (requires.length > 0) {
                const currentRequest = loaderUtils.getCurrentRequest(this);
                const node = SourceNode.fromStringWithSourceMap(
                    content, new SourceMapConsumer(sourceMap));
                node.add("\n\n" + FOOTER + requires.join("\n"));
                const result = node.toStringWithSourceMap({
                    file: currentRequest
                });
                callback(error, result.code, result.map.toJSON());
            } else {
                callback(error, content, sourceMap);
            }
        } else {
            if (requires.length > 0) {
                callback(error, content + "\n\n" + FOOTER + requires.join("\n"));
            } else {
                callback(error, content);
            }
        }
    });

    return undefined;
}
