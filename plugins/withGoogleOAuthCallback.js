const { withAppDelegate } = require('expo/config-plugins');

// Expo's scene delegate forwards URLs to AppDelegate, including on iOS 27.
module.exports = function withGoogleOAuthCallback(config) {
  return withAppDelegate(config, mod => {
    if (mod.modResults.language !== 'swift') throw new Error('Google OAuth requires the Swift Expo AppDelegate.');
    let source = mod.modResults.contents;
    const handler = 'if GIDSignIn.sharedInstance.handle(url) { return true }';
    if (!source.includes(handler)) {
      const method = /public override func application\(\s*_ app: UIApplication,\s*open url: URL,[\s\S]*?\) -> Bool \{/;
      if (!method.test(source)) throw new Error('Google OAuth: AppDelegate URL handler was not found; inspect the native template.');
      source = source.replace(method, match => `${match}\n    ${handler}`);
    }
    if (!/^import GoogleSignIn$/m.test(source)) source = `import GoogleSignIn\n${source}`;
    mod.modResults.contents = source;
    return mod;
  });
};
