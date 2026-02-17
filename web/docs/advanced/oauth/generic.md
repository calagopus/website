# Generic OAuth Setup

This guide will show you how to setup a generic OAuth provider for your Calagopus Panel.

This guide will show you first on how to find the required identifiers used by your provider, and then will show you on how you can integrate your generic OIDC provider to Calagopus Panel.

### Example files
Theses are example files made by the community that you can use as a preset. You will need to replace `id.example.com` with your own OIDC provider.\
Pocket-ID: [Download `pocket-id.yaml` ➚](./files/pocket-id.yml)\
Authentik: [Download `authentik.yaml` ➚](./files/authentik.yml)

If your provider isn't listed here, you may have to follow the steps below to adapt to your setup.

### Find the required identifiers
Most OIDC providers (hosted or self-hosted) come with what's known as a standard "well-known" URL. Depending of your provider, it should exist under the path `/.well-known/openid-configuration`. It should be a JSON object where it contains the 3 URLs we need.

For example, if your provider's URL is `https://id.example.com`, add `/.well-known/openid-configuration` at the end, so you would go to `https://id.example.com/.well-known/openid-configuration`.

::: warning
If that file does not exist, you may need to refer to your provider's documentation to find the 3 URLs needed.
:::

To obtain the URLs we need, visit the "well-known" URL from your provider (in this case, mine would be `https://id.example.com/.well-known/openid-configuration`) in a browser.

Once you arrived to the page, find the 3 values here and paste it on a clipboard or a text file:
| Identifier     | JSON Key                 |
|----------------|--------------------------|
| **Auth URL**   | `authorization_endpoint` |
| **Token URL**  | `token_endpoint`         |
| **Info URL**   | `userinfo_endpoint`      |

On the same JSON object, look for the `claims_supported` key, and find the claims you need. Below are some JSON path examples that you could use, although you may need to tweak them a little for your specific provider.
| Identifier          | Example                | Required |
|---------------------|------------------------|----------|
| **Identifier Path** | `$.sub`                | ✅        |
| **Email Path**      | `$.email`              | ❌        |
| **Username Path**   | `$.preferred_username` | ❌        |
| **First Name Path** | `$.given_name`         | ❌        |
| **Last Name Path**  | `$.family_name`        | ❌        |

Finally, look for the `scopes_supported` key, and find the scopes you need. Usually, you should only put `openid`, `profile` and `email`, but it may depend on your provider.

Then, on your provider, setup Client ID and Client Secrets for Calagopus to use.

### Configuring the OAuth Provider
Once you got your URL's, your claims and your scopes, head to your Calagopus Panel's admin page, and click on `OAuth Providers` on the side.
![OAuth Providers tab](./files/images/oauth-providers.png)

Then, click on the Create button and you should arrive to a page similar to this:
![Create OAuth provider page](./files/images/create.png)

On that page, fill out theses fields according to the table below:
*todo: make table of stuff*

Once that's done, you can click on the `Save` button, and your custom OIDC provider should be setup!

### Test the configuration
To test your configuration, head into your account settings, click on `OAuth Links` at the sidebar, and connect to your OIDC provider's account. If everything works correctly, you should now be able to see your OIDC provider's in your list.

### Troubleshooting
*todo: add troubleshooting guides*