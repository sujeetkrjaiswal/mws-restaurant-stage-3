const { src, dest, watch } = require("gulp");
function copyAssets() {
  return src("./assets/**/*").pipe(dest("./.tmp/public"));
}

exports.copyAssets = copyAssets;
exports.default = copyAssets;
