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
const FOOTER = "/*** REQUIRES FROM autoload-plugins-loader ***/\n";

module.exports = function(content, sourceMap) {
    const resourcePath = this.resourcePath;

    if (this.cacheable) {
        this.cacheable();
    }

    const query = loaderUtils.getOptions(this) || {};
    const requires = [];
    const keys = Object.keys(query);

    if (keys.length == 1 && typeof query[keys[0]] == "boolean") {
        const mod = keys[0];
        const modPath = path.resolve(__dirname, mod);
        requires.push(`require("${modPath}");   // ${mod}`);
    } else {
        keys.forEach(function(name) {
            const mod = name;
            const modPath = path.resolve(__dirname, mod);
            requires.push(`require("${modPath}");   // ${mod}`);
        });
    }

    if (sourceMap) {
        const currentRequest = loaderUtils.getCurrentRequest(this);
        const node = SourceNode.fromStringWithSourceMap(content, new SourceMapConsumer(sourceMap));
        node.add("\n\n" + FOOTER + requires.join("\n"));
        const result = node.toStringWithSourceMap({
            file: currentRequest
        });
        this.callback(null, result.code, result.map.toJSON());
        return;
    }

    return content + "\n\n" + FOOTER + requires.join("\n");
}
