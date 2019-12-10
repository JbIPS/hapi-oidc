const Url = require('url');

const { Issuer } = require('openid-client');
const Hoek = require('hoek');

const pkg = require('../package.json');
const scheme = require('./scheme');

const MANUAL_SETTINGS = ['issuer', 'authorization', 'token', 'userinfo', 'jwks'];
const PLUGIN_DEFAULTS = {
  cookie: 'hapi-oidc',
  scope: 'openid',
};

exports.plugin = {
  pkg,
  register: async (server, options) => {
    const config = Hoek.applyToDefaults(PLUGIN_DEFAULTS, options);

    // Validate config
    if (!config.clientId || !config.clientSecret) throw new Error('You must provide a clientId and a clientSecret');
    if (!config.callbackUrl) throw new Error('You must provide a callbackUrl');
    if (!config.discoverUrl && MANUAL_SETTINGS.some(k => !(k in config))) throw new Error('You must provide a discoverUrl or a valid manual settings');

    const cookieName = config.cookie;
    const issuer = config.discoverUrl ? await Issuer.discover(config.discoverUrl) : new Issuer({
      issuer: config.issuer,
      authorization_endpoint: config.authorization,
      token_endpoint: config.token,
      userinfo_endpoint: config.userinfo,
      jwks_uri: config.jwks,
    });
    const client = new issuer.Client({
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    server.route({
      method: 'GET',
      path: Url.parse(config.callbackUrl).path,

      handler: async (request, h) => {
        const { state } = request.state[cookieName];
        try {
          const token = await client.authorizationCallback(
            config.callbackUrl, request.query, { state },
          );
          const userInfos = await client.userinfo(token);
          h.state(cookieName, { credentials: token, artifacts: userInfos });
          return h.redirect(state).takeover();
        } catch (err) {
          request.log(['error', 'auth'], err.error_description);
          throw err;
        }
      },
    });
    server.auth.scheme('oidc', scheme({
      cookieName, callbackUrl: config.callbackUrl, scope: config.scope, client,
    }));
  },
};
