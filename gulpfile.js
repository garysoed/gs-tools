var gn = require('./gulp/gulp-node')(__dirname, require('gulp'));
var karmaTasks = require('./gulp-tasks/karma')(require('karma').Server);
var sassTasks = require('./gulp-tasks/sass')(require('gulp-concat'), require('gulp-sass'))
var typedocTasks = require('./gulp-tasks/typedoc')(
    require('gulp-concat'),
    require('gulp-sass'),
    require('gulp-typedoc'));

gn.task('compile-test', gn.parallel(
    'src:compile-test',
    'src/assert:compile-test',
    'src/async:compile-test',
    'src/collection:compile-test',
    'src/data:compile-test',
    'src/dispose:compile-test',
    'src/event:compile-test',
    'src/inject:compile-test',
    'src/net:compile-test',
    'src/ng:compile-test',
    'src/secure:compile-test',
    'src/typescript:compile-test',
    'src/ui:compile-test'
));

gn.task('lint', gn.parallel(
    'src:lint',
    'src/assert:lint',
    'src/async:lint',
    'src/collection:lint',
    'src/data:lint',
    'src/dispose:lint',
    'src/event:lint',
    'src/inject:lint',
    'src/mock:lint',
    'src/net:lint',
    'src/ng:lint',
    'src/secure:lint',
    'src/testing:lint',
    'src/typescript:lint',
    'src/ui:lint'
));

gn.exec('lint', gn.series('.:lint'));
gn.exec(
    'doc',
    typedocTasks.compile(
        gn,
        ['!src/test-base.ts', 'node_modules/typescript/lib/lib.es6.d.ts'],
        'gs-tools',
        'cloudy-sky'));

var mockAngular = {
  pattern: 'src/testing/mock-angular.js',
  included: true
};
gn.exec('test', gn.series('.:compile-test', karmaTasks.once(gn, '**', [mockAngular])));
gn.exec('karma', gn.series('.:compile-test', karmaTasks.watch(gn, '**', [mockAngular])));

gn.exec('watch-test', gn.series(
    '.:compile-test',
    function _watch() {
      gn.watch(['src/**/*.ts'], gn.series('.:compile-test'));
    }));
