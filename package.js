Package.describe({
  name: 'philippspo:wizard',
  summary: "A wizard component for AutoForm.",
  version: '0.0.1'
  // git: ' /* Fill me in! */ '
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  // api.addFiles('philippspo:wizard.js');

  api.use(['underscore', 'deps', 'templating', 'ui', 'session', 'amplify'], 'client');
  api.use('aldeed:autoform', 'client');
  
  api.addFiles([
    'wizard.html',
    'wizard.js',
    'cache.js'
  ], 'client');
});

// Package.onTest(function(api) {
//   api.use('tinytest');
//   api.use('philippspo:wizard');
//   api.addFiles('philippspo:wizard-tests.js');
// });
