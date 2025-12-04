const ReactRefractor = require("../node_modules/react-refractor/dist/index.js");

module.exports = ReactRefractor.Refractor || ReactRefractor;
module.exports.default = ReactRefractor.Refractor || ReactRefractor;
module.exports.Refractor = ReactRefractor.Refractor || ReactRefractor;
module.exports.hasLanguage = ReactRefractor.hasLanguage;
module.exports.registerLanguage = ReactRefractor.registerLanguage;
