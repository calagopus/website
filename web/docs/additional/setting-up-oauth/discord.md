---
title: Discord OAuth Setup
description: Set up Discord OAuth login for your Calagopus Panel, from registering the application on the Discord developer portal to configuring the provider in the admin area.
---

# Discord OAuth Setup
This guide walks through setting up Discord OAuth for your Calagopus Panel.

### Prerequisites
To set up Discord OAuth, you need:

* [A Discord account](https://discord.com)
* A running Calagopus Panel

### Downloading required files
Download the `discord.yml` template to import the Discord provider configuration without entering values manually.

Right-click the link below and save the file locally.

<a href="/oauth2/discord.yml" download>Download <code>discord.yml</code> ➚</a>

### Import the template config
Once `discord.yml` has been downloaded, head to your Calagopus Panel's admin page, and click on `OAuth Providers` on the side.
![OAuth Providers tab](./files/images/oauth-providers.webp)

Then, click on the Import button and import the `discord.yml` file.
![Import OAuth Button](./files/images/import.webp)

Once imported, click on the newly created Discord provider's ID and you should arrive to a page similar to this:
![Discord OAuth page](./files/images/discord/page.webp)

Copy the Redirect URL provided by the panel and proceed to the next step.

### Setting up Discord OAuth

#### Creating the application
Go to [Discord's Developer Portal](https://discord.com/developers/applications), and create an application.
![Discord Developer Portal applications page with the New Application button highlighted](./files/images/discord/image-1.webp)

In the popup, type the name of your application, which will be shown on the Discord login page. Select a team if you have one and then click on `Create`.
![Discord Create a new app dialog with the name Calagopus, a team selector, and Create button](./files/images/discord/image-2.webp)

On the General Information page, you can optionally set an icon and description. This is not required and not covered here.

#### Add your Redirect URL to Discord OAuth
On the left sidebar, click on `OAuth2`.
![Discord Developer Portal sidebar with the OAuth2 entry highlighted](./files/images/discord/image-3.webp)

On the Redirects section, click on `Add Redirect` and paste the redirect URL Calagopus Panel has given you.
![Discord OAuth2 Redirects section with the Calagopus redirect URL entered and an Add Another button](./files/images/discord/image-4.webp)

At the bottom, you should see the warning below:
![Discord unsaved changes warning bar with a Save Changes button](./files/images/discord/image-5.webp)
Click on the `Save Changes` button below.

#### Issue an OAuth Client ID and Secret
On the same `OAuth2` page, look for the Client information section. Reset your Client Secret by clicking on the `Reset Secret` button.
![Discord Client information section with the Client ID, hidden Client Secret, and Reset Secret button](./files/images/discord/image-6.webp)

Once you reset your Client Secret, copy both your Client ID and Client Secret. You will need those for the next step.

### Configuring the OAuth Provider
Back in the panel, enter the Client ID and Client Secret you copied from Discord.

On the switches below, choose if you want to enable Discord OAuth, only allow login, allow the user to view the connection and allow the user to link and unlink their accounts.

The template also fills in the Avatar URL Template, so a user's Discord avatar becomes their panel avatar the first time they log in. Clear that field if you'd rather leave avatars alone, or read [Avatars](../../panel/features/admin/oauth-providers.md#avatars) for what it does.

It should normally look like this:
![Discord Config](./files/images/discord/page.webp)

Finally, save your changes.

### Test the configuration
To test your configuration, head into your account settings, click on `OAuth Links` at the sidebar, and connect to your Discord account.
![Testing Discord](./files/images/discord/test.webp)

If everything works correctly, you should now be able to see your Discord account in your list.
![List](./files/images/discord/list.webp)

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| Error: "Invalid OAuth2 redirect_uri" | The redirect URL in Discord doesn't match the one provided by Calagopus Panel. Go back to your Calagopus Panel OAuth provider configuration page and copy the exact Redirect URL shown, then go to the [Discord Developer Portal](https://discord.com/developers/applications), select your application, navigate to OAuth2 then Redirects, and make sure the redirect URL matches exactly (including `https://`, trailing slashes, etc.) before clicking **Save Changes**. |
| Error: "Unknown application" | The Client ID or Client Secret set on the panel is invalid. Go to the [Discord Developer Portal](https://discord.com/developers/applications), select your application, navigate to OAuth2, copy your Client ID, click **Reset Secret** to generate a new Client Secret and copy it, then update both values in your Calagopus Panel OAuth provider configuration and save. |
