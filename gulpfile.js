const { src, dest, watch } = require("gulp");
var gzip = require("gulp-gzip");

function copyAssets() {
  return src("./assets/**/*")
    .pipe(dest("./.tmp/public"));
}
function compressAssets() {
  return src("./assets/**/*")
    .pipe(gzip())
    .pipe(dest("./.tmp/public"));
}

exports.copyAssets = copyAssets;
exports.compressAssets = compressAssets;
