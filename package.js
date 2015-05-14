Package.describe({
  name: 'planifica:wizard',
  summary: "A wizard component for AutoForm.",
  version: '0.0.5',
  git: 'https://github.com/Planifica/meteor-wizard.git'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.0');
  api.use([
	'underscore', 
	'deps', 
	'templating', 
	'ui', 
	'session',
  ], 'client');
  api.use('aldeed:autoform@5.1.2');
  api.use('aldeed:simple-schema@1.3.3', ['client', 'server']);
  api.use('u2622:persistent-session@0.3.5');
  api.imply(['aldeed:simple-schema']);
  
  api.addFiles([
    'wizard.html',
    'wizard.js',
    'wizard.css'
  ], 'client');
});

// Package.onTest(function(api) {
//   api.use('tinytest');
//   api.use('philippspo:wizard');
//   api.addFiles('philippspo:wizard-tests.js');
// });
