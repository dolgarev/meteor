var selftest = require('../tool-testing/selftest.js');
var catalog = require('../packaging/catalog/catalog.js');
var catalogLocal = require('../packaging/catalog/catalog-local.js');
var buildmessage = require('../utils/buildmessage.js');
var files = require('../fs/files');

selftest.define("self-test catalog scan tolerates cold official catalog",
async function () {
  // Simulate a cold ~/.meteor/package-metadata cache by making every release
  // lookup come back empty. Without buildingSelfTestCatalog, this causes
  // versionsFrom() in scanned packages (e.g. packages/non-core/jquery) to
  // raise a fatal "Unknown release …" buildmessage.
  var originalGetReleaseVersion = catalog.official.getReleaseVersion;
  catalog.official.getReleaseVersion = async function () { return null; };

  try {
    var localCatalog = new catalogLocal.LocalCatalog();
    var packagesDir = files.pathJoin(files.getCurrentToolsDir(), 'packages');

    var messages = await buildmessage.capture({
      title: "scanning core packages for cold-catalog regression test",
    }, async function () {
      await localCatalog.initialize({
        localPackageSearchDirs: [
          packagesDir,
          files.pathJoin(packagesDir, 'non-core'),
          files.pathJoin(packagesDir, 'non-core', '*', 'packages'),
        ],
        buildingSelfTestCatalog: true,
      });
    });

    if (messages.hasMessages()) {
      selftest.fail(
        "scan errored despite buildingSelfTestCatalog=true:\n" +
        messages.formatMessages(0)
      );
    }
  } finally {
    catalog.official.getReleaseVersion = originalGetReleaseVersion;
  }
});
