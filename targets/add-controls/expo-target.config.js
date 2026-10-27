/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'AsteraControls',
  displayName: 'Astera Controls',
  deploymentTarget: '18.0',
  entitlements: {
    'com.apple.security.application-groups': ['group.com.diegoeiras.astera'],
  },
};
