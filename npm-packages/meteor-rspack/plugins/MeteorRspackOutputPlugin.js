// MeteorRspackOutputPlugin.js
//
// This plugin outputs a JSON stringified with a tag delimiter each time
// a new Rspack compilation happens. The JSON content is configurable
// via plugin instantiation options.

class MeteorRspackOutputPlugin {
  constructor(options = {}) {
    this.pluginName = 'MeteorRspackOutputPlugin';
    this.options = options;
    // The data to be output as JSON, can be a static object or a function
    this.getData =
      typeof options.getData === 'function'
        ? options.getData
        : () => options.data || {};
  }

  apply(compiler) {
    const { devServer } = compiler.options;

    let devServerUrl;
    if (devServer) {
      const protocol = devServer.server?.type === "https" ? "https" : "http";
      const host =
        devServer.host && devServer.host !== "0.0.0.0"
          ? devServer.host
          : "localhost";
      const port = devServer.port ?? 8080;
      devServerUrl = `${protocol}://${host}:${port}`;
    }

    // Hook into the 'done' event which fires after each compilation completes
    compiler.hooks.done.tap(this.pluginName, stats => {
      const data = { ...(this.getData(stats) || {}), devServerUrl };
      const jsonString = JSON.stringify(data);
      const output = `[Meteor-Rspack]${jsonString}[/Meteor-Rspack]`;
      console.log(output);
    });
  }
}

module.exports = { MeteorRspackOutputPlugin };
