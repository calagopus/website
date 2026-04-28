# Setting up Allocations

Allocation is a combination of IP and Port that you can assign to a server. The allocation would be the IP address of your network interface, such as `65.20.69.420`, or when behind NAT, an internal IP.

To create allocations, go to Nodes, then click on your node, and click on the Allocation tab.
![](./images/allocation-1.webp)

Then, click on the Create button and a popup should come up:
![](./images/allocation-popup.webp)

To find the IP to be used for the allocation, type `hostname -I | awk '{print $1}'` on your terminal. Alternatively, you can type `ip addr | grep "inet "` to see all your available interfaces and IP addresses, or use `0.0.0.0` as the IP to bind all the available interfaces.

::: warning
You can use `127.0.0.1` for allocations if you don't want the server to be exposed via the internet. This is useful for internal services that are hosted locally on the same server.
:::

The IP Alias can be set to anything, as this value is shown to the user in the console, the network tab, etc. This is useful for people who are behind NAT and/or don't want to show their IP directly.

The Port Ranges value is what you'll use to connect to your server. It can either be a single port `10000`, or a range `10000-11000`.

Once you're done filling theses 2-3 values, click on the Create button, and you should now be able to assign allocations to servers!
