# Generic OAuth Setup

This guide will show you how to setup a generic OAuth provider for your Calagopus Panel.

This guide will show you first on how to find the required identifiers used by your provider, and then will show you on how you can integrate your generic OIDC provider to Calagopus Panel.

### Example files
Theses are example files made by the community that you can use as a preset. You will need to replace `id.example.com` with your own OIDC provider.\
Pocket-ID: <a href="./files/pocket-id.yml" download>Download <code>pocket-id.yml</code> ➚</a>\
Authentik: <a href="./files/authentik.yml" download>Download <code>authentik.yml</code> ➚</a>

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
| **Identifier Path** | `$.sub`                | :white_check_mark:        |
| **Email Path**      | `$.email`              | :x:        |
| **Username Path**   | `$.preferred_username` | :x:        |
| **First Name Path** | `$.given_name`         | :x:        |
| **Last Name Path**  | `$.family_name`        | :x:        |

Finally, look for the `scopes_supported` key, and find the scopes you need. Usually, you should only put `openid`, `profile` and `email`, but it may depend on your provider.

Then, on your provider, setup Client ID and Client Secrets for Calagopus to use.

### Configuring the OAuth Provider
Once you got your URL's, your claims and your scopes, head to your Calagopus Panel's admin page, and click on `OAuth Providers` on the side.
![OAuth Providers tab](./files/images/oauth-providers.png)

Then, click on the Create button and you should arrive to a page similar to this:
![Create OAuth provider page](./files/images/create.png)

On that page, fill out theses fields according to the guide below. It will explain what each field represents and give you some examples for [Pocket-ID](./files/pocket-id.yml).

## General Information
### Name
This would be the name of your provider, it will be displayed on the OAuth list of the user.

Required: :white_check_mark:\
Example: `Pocket-ID`

### Description
This would be a description of your provider, useful for organization.

Required: :x:


## OAuth Provider Config
### Client ID
This is your Client ID that your provider has given you.

Required: :white_check_mark:

### Client Secret
This is your Client Secret that your provider has given you.

Required: :white_check_mark:


## OAuth URLs
### Auth URL
This is the Authentication URL that you have grabbed from the `authorization_endpoint` JSON key.

Required: :white_check_mark:\
Example: `https://id.example.com/authorize`

### Token URL
This is the Token URL that you have grabbed from the `token_url` JSON key.

Required: :white_check_mark:\
Example: `https://id.example.com/api/oidc/token`

### Info URL
This is the User Info URL that you have grabbed from the `info_url` JSON key.

Required: :white_check_mark:\
Example: `https://id.example.com/api/oidc/userinfo`

### Basic Auth
Enable this if your provider transmits the Client ID and Client Secret via HTTP Basic Authentication. Do not enable this option unless you know what are you doing.

Required: :x:\
Example: Off


## Scopes and Paths
For all the paths, make sure to also add `$.` at the beginning, for example if your email path is `email`, you would do: `$.email`.
### Scopes
The scopes used to get the user data via OIDC.

Required: :x: according to the panel, although it is required if you want to extract the email, username, first and last name, and potentially the identifier aswell.\
Example: `openid`, `email`, `profile`

### Identifier Path
The Path to use to extract the unique user identifier from the Info URL response (https://serdejsonpath.live)

Required: :white_check_mark:\
Example: `$.sub`

### Email Path
The Path to use to extract the email from the Info URL response (https://serdejsonpath.live)

Required: :x:\
Example: `$.email`

### Username Path
The Path to use to extract the username from the Info URL response (https://serdejsonpath.live)

Required: :x:\
Example: `$.preferred_username`

### First Name Path
The Path to use to extract the first name from the Info URL response (https://serdejsonpath.live)

Required: :x:\
Example: `$.given_name`

### Last Name Path
The Path to use to extract the last name from the Info URL response (https://serdejsonpath.live)

Required: :x:\
Example: `$.family_name`


## Options
### Enabled
Enable this if you want users to be able to access the panel via the custom provider.

### Only allow Login
Enable this if you don't want people registering accounts via your OIDC provider.

### Link Viewable to User
Allows the User to see the Connection and its identifier in the Client UI.

### Link Manageable by User
Allows the User to connect and disconnect with this provider

---

Once that's done, you can click on the `Save` button, and your custom OIDC provider should be setup!

### Test the configuration
To test your configuration, head into your account settings, click on `OAuth Links` at the sidebar, and connect to your OIDC provider's account. If everything works correctly, you should now be able to see your OIDC provider's in your list.

### Troubleshooting
*todo: add troubleshooting guides*