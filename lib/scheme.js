const Hoek = require('hoek');

const COOKIE_DEFAULTS = {
  isSameSite: 'Lax',
  path: '/',
  ttl: 3600 * 1000,
  encoding: 'iron',
  isSecure: true,
  clearInvalid: true,
};

module.exports = ({
  cookieName, callbackUrl, scope, client,
}) => (server, schemeOptions) => {
  const schemeConfig = Hoek.applyToDefaults(COOKIE_DEFAULTS, schemeOptions);
  server.state(cookieName, schemeConfig);
  return {
    authenticate: async (request, h) => {
      const { oidc } = request.state;
      if (oidc && oidc.credentials) {
        return h.authenticated({ credentials: oidc.credentials });
      }
      const state = request.route.path;
      h.state(cookieName, { state });
      const redirectUrl = client.authorizationUrl({
        redirect_uri: callbackUrl,
        scope,
        state,
      });

      return h.redirect(redirectUrl).takeover();
    },
  };
};
