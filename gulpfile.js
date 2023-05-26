const { src, dest, parallel, series, watch } = require("gulp");
const browserSync = require("browser-sync").create();
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;
const sass = require("gulp-sass")(require("sass"));
const less = require("gulp-less");
const autoprefixer = require("gulp-autoprefixer");
const cleancss = require("gulp-clean-css");
// const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const del = require("del");
const htmlmin = require("gulp-htmlmin");
const svgsprite = require("gulp-svg-sprite");
const babel = require("gulp-babel");
const notify = require("gulp-notify");
const sourcemaps = require("gulp-sourcemaps");
const argv = require("yargs").argv;
const gulpif = require("gulp-if");
const { src, task } = require("gulp");
const ghPages = require("gulp-gh-pages");

task("deploy", () => src("./dist/**/*").pipe(ghPages()));
// const webp                                  = require('gulp-webp')

gulp.task("deploy", function () {
  return gulp.src("./dist/**/*").pipe(deploy());
});

function htmlMinify() {
  return src("src/*.html")
    .pipe(gulpif(argv.production, htmlmin({ collapseWhitespace: true })))
    .pipe(dest("dist"))
    .pipe(gulpif(argv.development, browserSync.stream()));
}

let preprocessor = "sass";
function stylesPre() {
  return src("src/" + preprocessor + "/*")
    .pipe(eval(preprocessor)())
    .pipe(dest("src/css"));
}

function styles() {
  return src("src/css/**/*.css")
    .pipe(gulpif(argv.development, sourcemaps.init()))
    .pipe(concat("allStyles.css"))
    .pipe(autoprefixer(["cover 99.5%", "last 20 versions", "not dead"]))
    .pipe(gulpif(argv.production, cleancss({ level: 2 })))
    .pipe(gulpif(argv.development, sourcemaps.write()))
    .pipe(dest("dist/css"))
    .pipe(gulpif(argv.development, browserSync.stream()));
}

function scripts() {
  return src("src/js/**/*.js")
    .pipe(gulpif(argv.development, sourcemaps.init()))
    .pipe(babel({ presets: ["@babel/env"] }))
    .pipe(concat("allScripts.js"))
    .pipe(
      gulpif(
        argv.production,
        uglify({ toplevel: true }).on("error", notify.onError())
      )
    )
    .pipe(gulpif(argv.development, sourcemaps.write()))
    .pipe(dest("dist/js"))
    .pipe(gulpif(argv.development, browserSync.stream()));
}

function imgs() {
  return (
    src("src/img/**/*", { base: "src/img" })
      .pipe(newer("dist/img"))
      // .pipe(imagemin())
      // .pipe(webp())
      .pipe(dest("dist/img"))
  );
}

function svgSprite() {
  return src("src/svg/**/*.svg")
    .pipe(
      svgsprite({
        mode: { stack: { sprite: "../sprite.svg" } },
      })
    )
    .pipe(dest("dist/img"));
}

function removeOld() {
  return del("dist/**/*");
}

function liveServer() {
  browserSync.init({
    server: { baseDir: "dist" },
    notify: true,
    online: true,
  });
}

function watching() {
  watch("src/*.html", htmlMinify);
  watch("src/css/**/*.css", styles);
  watch("src/" + preprocessor + "/*", series(stylesPre, styles));
  watch("src/js/**/*.js", scripts);
  watch(["src/img/**/*", "!src/img/svg/**/*.svg"], imgs);
  watch("src/img/svg/**/*.svg", svgSprite);
}

async function dev() {
  if (argv.development) {
    liveServer();
    watching();
  }
}

exports.default = series(
  removeOld,
  parallel(htmlMinify, series(stylesPre, styles), scripts, imgs, svgSprite),
  dev
);
