const Url = require('url');

const { Issuer } = require('openid-client');
const Hoek = require('hoek');

const pkg = require('../package.json');
const scheme = require('./scheme');

const PLUGIN_DEFAULTS = {
  cookie: 'hapi-oidc',
};

exports.plugin = {
  pkg,
  register: async (server, options) => {
    const config = Hoek.applyToDefaults(PLUGIN_DEFAULTS, options);

    // Validate config
    if (!config.clientId || !config.clientSecret) throw new Error('You must provide a clientId and a clientSecret');
    if (!config.callbackUrl) throw new Error('You must provide a callbackUrl');
    if (!config.discoverUrl) throw new Error('You must provide a discoverUrl');

    const cookieName = config.cookie;
    const issuer = await Issuer.discover(config.discoverUrl);
    const client = new issuer.Client({
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    server.route({
      method: 'GET',
      path: Url.parse(config.callbackUrl).path,

      handler: async (request, h) => {
        const { state } = request.state.oidc;
        const token = await client.authorizationCallback(
          config.callbackUrl, request.query, { state },
        );
        const { email } = await client.userinfo(token);
        h.state(cookieName, { credentials: { email } });
        return h.redirect(state).takeover();
      },
    });
    server.auth.scheme('oidc', scheme(cookieName, config.callbackUrl, client));
  },
};
