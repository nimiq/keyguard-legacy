const gulp = require('gulp');

const NimiqBuild = require('../../meta/build-process/nimiq-base-gulpfile.js');

gulp.task('clean', () => NimiqBuild.cleanBuild('deployment-keyguard/dist'));
gulp.task('clean-test', () => NimiqBuild.cleanBuild('deployment-keyguard/dist-test'));

const replacementsForRelease = [['https://cdn.nimiq-testnet.com', 'https://cdn.nimiq.com']];

gulp.task('build', gulp.series('clean', () => NimiqBuild.build({
    jsEntry: 'src/keyguard.js',
    cssEntry: 'src/keyguard.css',
    htmlEntry: 'src/index.html',
    rootPath: `${__dirname}/../../`,
    distPath: 'deployment-keyguard/dist',
    replaceHTMLStrings: replacementsForRelease
})));

gulp.task('build-iframe', gulp.series('build', () => NimiqBuild.build({
    jsEntry: 'src/keyguard.js',
    cssEntry: 'src/keyguard.css',
    htmlEntry: 'src/iframe.html',
    rootPath: `${__dirname}/../../`,
    distPath: 'deployment-keyguard/dist',
    replaceHTMLStrings: replacementsForRelease
})));

gulp.task('build-test', gulp.series('clean-test', () => NimiqBuild.build({
    jsEntry: 'src/keyguard.js',
    cssEntry: 'src/keyguard.css',
    htmlEntry: 'src/index.html',
    rootPath: `${__dirname}/../../`,
    distPath: 'deployment-keyguard/dist-test'
})));

gulp.task('build-test-iframe', gulp.series('build-test', () => NimiqBuild.build({
    jsEntry: 'src/keyguard.js',
    cssEntry: 'src/keyguard.css',
    htmlEntry: 'src/iframe.html',
    rootPath: `${__dirname}/../../`,
    distPath: 'deployment-keyguard/dist-test'
})));

gulp.task('default', gulp.parallel('build-iframe', 'build-test-iframe'));
