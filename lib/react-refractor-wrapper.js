const reactRefractorPath = require.resolve("react-refractor");
const ReactRefractor = require(reactRefractorPath);

module.exports = ReactRefractor.Refractor || ReactRefractor;
module.exports.default = ReactRefractor.Refractor || ReactRefractor;
module.exports.Refractor = ReactRefractor.Refractor || ReactRefractor;
module.exports.hasLanguage = ReactRefractor.hasLanguage;
module.exports.registerLanguage = ReactRefractor.registerLanguage;
