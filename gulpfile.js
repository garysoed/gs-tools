var gn = require('./gulp/gulp-node')(__dirname, require('gulp'));
var karmaTasks = require('./gulp-tasks/karma')(require('karma').Server);
var typedoc = require('gulp-typedoc');

gn.task('compile-test', gn.parallel(
    'src:compile-test',
    'src/collection:compile-test',
    'src/data:compile-test',
    'src/dispose:compile-test',
    'src/net:compile-test',
    'src/ng:compile-test',
    'src/typescript:lint',
    'src/ui:compile-test'
));

gn.task('lint', gn.parallel(
    'src:lint',
    'src/collection:lint',
    'src/data:lint',
    'src/dispose:lint',
    'src/event:lint',
    'src/mock:lint',
    'src/net:lint',
    'src/ng:lint',
    'src/typescript:lint',
    'src/ui:lint'
));

gn.exec('lint', gn.series('.:lint'));
gn.exec('doc', function() {
  return gn.src(['**/*.ts', '!src/**/*_test.ts', '!src/test-base.ts', '!node_modules/**', 'node_modules/typescript/lib/lib.es6.d.ts'])
      .pipe(typedoc({
        "target": "es5",
        "module": "commonjs",
        "moduleResolution": "node",
        "isolatedModules": false,
        "jsx": "react",
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "noImplicitAny": false,
        "noLib": false,
        "preserveConstEnums": true,
        "suppressImplicitAnyIndexErrors": true,
        "rootDir": "./",

        out: "./doc",
        json: "doc/doc.json",

        // TypeDoc options (see typedoc docs)
        name: "gs-tools",
        theme: 'typedoc-theme',
        ignoreCompilerErrors: false,
        version: true,
      }));
});


gn.exec('doc-default', function() {
  return gn.src(['**/*.ts', '!src/**/*_test.ts', '!node_modules/**', 'node_modules/typescript/lib/lib.es6.d.ts'])
      .pipe(typedoc({
        "target": "es5",
        "module": "commonjs",
        "moduleResolution": "node",
        "isolatedModules": false,
        "jsx": "react",
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "noImplicitAny": false,
        "noLib": false,
        "preserveConstEnums": true,
        "suppressImplicitAnyIndexErrors": true,
        "rootDir": "./",

        out: "./doc-default",
        json: "doc-default/doc.json",

        // TypeDoc options (see typedoc docs)
        name: "gs-tools",
        ignoreCompilerErrors: false,
        version: true,
      }));
})

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
