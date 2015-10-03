Package.describe({
  name: 'ruyi:sm2',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'an implementation of the SM2 algorithm',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');
  api.use('ecmascript');
  api.use('momentjs:moment');
  api.use('underscore');
  api.use('mongo');
  api.addFiles('sm2.js', 'server');

  api.export("SMCard");
  api.export("SMCardModel");
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('momentjs:moment');
  api.use('mongo');
  api.use('tinytest');
  api.use('ruyi:sm2'); 
  api.addFiles('sm2-tests.js', 'server');
});
