Package.describe({
  name: 'planifica:wizard',
  summary: "A wizard component for AutoForm.",
  version: '0.0.1',
  git: 'https://github.com/Planifica/meteor-wizard.git'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.0');
  // api.addFiles('philippspo:wizard.js');

  api.use([
	'underscore', 
	'deps', 
	'templating', 
	'ui', 
	'session', 
	'amplify@1.0.0'
  ], 'client');
  api.use('aldeed:autoform@4.0.2');
  api.use('aldeed:simple-schema@1.1.0');
  
  api.addFiles([
    'wizard.html',
    'wizard.js',
    'wizard.css',
    'cache.js'
  ], 'client');
});

// Package.onTest(function(api) {
//   api.use('tinytest');
//   api.use('philippspo:wizard');
//   api.addFiles('philippspo:wizard-tests.js');
// });
