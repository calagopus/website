# Generic OIDC Fields

Theses fields explain what you should put while creating a custom OIDC provider. For this guide we will use the [Pocket-ID](./files/pocket-id.yml) file as the guide.

Once you have filled all or most of the fields, you can click on the `Save` button, and your custom OIDC provider should be setup! You can now go test your OIDC provider by going to [this guide ➚](./generic.md#test-the-configuration), under the Test the configuration section.

## General Information
### Name
This would be the name of your provider, it will be displayed on the OAuth list of the user.

Required: ✅\
Example: `Pocket-ID`

### Description
This would be a description of your provider, useful for organization.

Required: ❌


## OAuth Provider Config
### Client ID
This is your Client ID that your provider has given you.

Required: ✅

### Client Secret
This is your Client Secret that your provider has given you.

Required: ✅


## OAuth URLs
### Auth URL
This is the Authentication URL that you have grabbed from the `authorization_endpoint` JSON key.

Required: ✅\
Example: `https://id.example.com/authorize`

### Token URL
This is the Token URL that you have grabbed from the `token_url` JSON key.

Required: ✅\
Example: `https://id.example.com/api/oidc/token`

### Info URL
This is the User Info URL that you have grabbed from the `info_url` JSON key.

Required: ✅\
Example: `https://id.example.com/api/oidc/userinfo`

### Basic Auth
Enable this if your provider transmits the Client ID and Client Secret via HTTP Basic Authentication. Do not enable this option unless you know what are you doing.

Required: ❌\
Example: Off


## Scopes and Paths
For all the paths, make sure to also add `$.` at the beginning, for example if your email path is `email`, you would do: `$.email`.
### Scopes
The scopes used to get the user data via OIDC.

Required: ❌ according to the panel, although it is required if you want to extract the email, username, first and last name, and potentially the identifier aswell.\
Example: `openid`, `email`, `profile`

### Identifier Path
The Path to use to extract the unique user identifier from the Info URL response (https://serdejsonpath.live)

Required: ✅\
Example: `$.sub`

### Email Path
The Path to use to extract the email from the Info URL response (https://serdejsonpath.live)

Required: ❌\
Example: `$.email`

### Username Path
The Path to use to extract the username from the Info URL response (https://serdejsonpath.live)

Required: ❌\
Example: `$.preferred_username`

### First Name Path
The Path to use to extract the first name from the Info URL response (https://serdejsonpath.live)

Required: ❌\
Example: `$.given_name`

### Last Name Path
The Path to use to extract the last name from the Info URL response (https://serdejsonpath.live)

Required: ❌\
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