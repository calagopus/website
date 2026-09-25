---
description: Install the Calagopus panel using platform-specific methods for TrueNAS SCALE, Unraid, Hostinger, and Portainer, which bundle the Panel and Wings in a single container.
---

# External Installation Methods

These methods install Calagopus through a specific NAS, homelab platform, or hosting provider's own app system, bundling the Panel and Wings together, instead of following the generic [Docker](../docker.md), [Package Manager](../pkgmanager.md), or [Binary](../binary.md) installation guides.

::: info Single-container setups
Game servers are CPU- and RAM-intensive workloads that compete with the Panel and Wings for resources in these single-container setups. They are well suited for homelab use or small deployments. For larger production hosting, consider running Wings on a dedicated machine connected to a standalone Panel instead, see the [main installation guide](../index.md).
:::

Choose your platform:

::::tabs
=== TrueNAS SCALE
See the [TrueNAS SCALE Installation](./truenas.md) guide. Install Calagopus directly from the TrueNAS Community Apps catalog, no manual Docker setup required. Includes Wings in the same container.

=== Unraid
See the [Unraid Installation](./unraid.md) guide. Install Calagopus from a Community Applications template. Includes Wings in the same container.

=== Hostinger
See the [Hostinger Installation](./hostinger.md) guide. Deploy Calagopus on a Hostinger VPS as a one-click application, no manual Docker setup required. Includes Wings in the same container.

=== Portainer
See the [Portainer Installation](./portainer.md) guide. Deploy Calagopus from a reusable Custom Template pointed at the official compose file, managed and updated entirely through Portainer's UI. Includes Wings in the same container.
::::
