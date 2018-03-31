const gulp = require('gulp');

const NimiqBuild = require('../../meta/build-process/nimiq-base-gulpfile.js');

gulp.task('build', () => NimiqBuild.build(
    'src/keyguard.js',
    'src/keyguard.css',
    'src/index.html',
    [],
    `${__dirname}/../../`,
    'dist'
));

gulp.task('default', ['build']);
