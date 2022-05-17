var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var log = require('fancy-log');
var autoprefixer = require('autoprefixer');
var browserSync = require('browser-sync').create();
var config = {
    'src': 'src/',
    'dest': './',
    'minify': true,
    'sourcemaps': false
};

const sass = require('gulp-sass')(require('sass'));


// Template
function twig() {
    return gulp.src(config.src + 'templates/*.twig')
        .pipe($.twig()).on('error', function(error) {
            log.error(error.message);
            this.emit('end');
        })
        .pipe($.htmlBeautify({
            indentSize: 4
        }))
        .pipe(gulp.dest(config.dest))
        .pipe(browserSync.stream());
}

// Validate HTML
function validateHtml() {
    return gulp.src(config.dest + '*.html')
        .pipe($.w3cHtmlValidator())
        .pipe($.w3cHtmlValidator.reporter());
}

// Compile and autoprefix stylesheets
function styles() {
    return gulp.src(config.src + 'scss/**/!(_)*.scss')
        .pipe($.if(config.sourcemaps, $.sourcemaps.init()))
        .pipe(sass({
            precision: 8,
            outputStyle: 'expanded'
        }).on('error', sass.logError))
        .pipe($.postcss([
            autoprefixer()
        ]))
        .pipe($.if(config.sourcemaps, $.sourcemaps.write()))
        .pipe(gulp.dest(config.dest + 'css'))
        .pipe(browserSync.stream())
        .pipe($.if(config.minify, $.cleanCss({compatibility: 'ie9'})))
        .pipe($.if(config.sourcemaps, $.sourcemaps.write()))
        .pipe($.if(config.minify, $.rename({suffix: '.min'})))
        .pipe($.if(config.minify, gulp.dest(config.dest + 'css')))
        .pipe(browserSync.stream());
}

// Lint stylesheets
function stylelint() {
    return gulp.src(config.src + 'scss/**/*.scss')
        .pipe($.postcss([
            require('stylelint')({fix: true})
        ], {
            syntax: require('postcss-scss')
        }))
        .pipe(gulp.dest(config.src + 'scss'));
}

// Compile javascript
function scripts() {
    return gulp.src(config.src + 'js/**/!(_)*.js')
        .pipe($.include().on('error', function(error) {
            log.error(error.message);
            this.emit('end');
        }))
        .pipe(gulp.dest(config.dest + 'js'))
        .pipe(browserSync.stream())
        .pipe($.if(config.sourcemaps, $.sourcemaps.init()))
        .pipe($.if(config.minify, $.uglify().on('error', function(error) {
            log.error(error.message);
            this.emit('end');
        })))
        .pipe($.if(config.sourcemaps, $.sourcemaps.write()))
        .pipe($.if(config.minify, $.rename({suffix: '.min'})))
        .pipe($.if(config.minify, gulp.dest(config.dest + 'js')))
        .pipe(browserSync.stream());
}

// Optimize images
function images() {
    return gulp.src(config.src + 'img/**/*.{gif,jpg,png,svg}')
        .pipe($.cache($.imagemin()))
        .pipe(gulp.dest(config.dest + 'img'))
        .pipe(browserSync.stream());
}

// Serve compiled files
function serve(done) {
    browserSync.init({
        server: config.dest,
        notify: false,
        snippetOptions: {
            rule: {
                match: /<\/body>/i
            }
        }
    });
    done();
}

// Watch files for changes
function watch(done) {
    gulp.watch(config.src + 'templates/**/*.twig', twig);
    gulp.watch(config.src + 'scss/**/*.scss', styles);
    gulp.watch(config.src + 'js/**/*.js', scripts);
    gulp.watch(config.src + 'img/**/*.{gif,jpg,png,svg}', images);
    done();
}


var build = gulp.parallel(twig, styles, scripts, images);

gulp.task('build', build);
gulp.task('watch', watch);
gulp.task('lint', stylelint);
gulp.task('validate', validateHtml);
gulp.task('default', gulp.series(build, gulp.parallel(serve, watch)));
