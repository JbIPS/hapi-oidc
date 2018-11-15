# Hapi-OIDC

OpenID-Connect authentication plugin for [hapi](https://github.com/hapijs/hapi).

## Configuration

This plugin needs some configuration to discover and connect to the OIDC server:
* `discoverUrl`: The discovery URL of your OIDC server
* `clientId`: Client ID given by your OIDC server
* `clientSecret`: Client secret given by your OIDC server
* `callbackUrl`: The full URL that the server will call after the authorization process
* [`cookie`]: Name of the cookie that will held the authentication. Defaults to `hapi-oidc`

Alternatively, you can manually setup your OIDC client by replacing the discover URL by:
* `issuer`: URL of the issuer
* `authorization`: Authorization endpoint
* `token`: Token generation endpoint
* `userinfo`: User infos endpoint
* `jwks`: JWKS endpoint

When registering the `oidc` scheme, you'll need to configure the [cookie settings](https://hapijs.com/api#server.state()) if defaults do not suits you:
* `password`=uuid4(),
* [`path`='/']
* [`ttl`= 3600 * 1000]
* [`encoding`='iron']
* [`isSecure`=true],
* [`clearInvalid`=true]

## Example

```javascript
const Hapi = require('hapi');
const uuid4 = require('uuid/v4');
const OIDC = require('hapi-oidc');

const routes = require('./routes');

const server = Hapi.server({
  port: 3000,
});

const init = async () => {
  await server.register([
    {
      plugin: OIDC,
      options: {
        discoverUrl: 'https://oidc-server.com/oauth2/default',
        clientId: 'XXXXXXXXXXXXXXX',
        clientSecret: 'XXXXXXXXXXXXXXXXXXXXXX',
        callbackUrl: 'https://my-server:3000/login_callback',
      },
    }
  ]);

  server.auth.strategy('oidc', 'oidc', {
    password: uuid4(),
  });

  server.route(routes);
  await server.start();
  server.log(['info'], `Server running at: ${server.info.uri}`);
};

init();

module.exports = server;
```
