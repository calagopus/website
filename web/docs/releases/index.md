---
title: Releases
description: Changelogs for Calagopus Panel, Wings and DB Agent releases, newest first.
prev: false
---

# Releases

Release notes for the Calagopus components. Each one is versioned independently, so pick
the changelog for the component you want to read about. Everything here comes straight
from the [release API](https://calagopus.com/api/releases), which mirrors the GitHub
releases of each repository.

<script setup>
import ReleaseIndex from '../../../.vitepress/components/ReleaseIndex.vue'
</script>

<ReleaseIndex />

::: tip Keep them in sync
Panel and Wings releases are frequently paired. When a release note says to update
one component before the other, follow that order to avoid transient issues. See the
[Panel](../panel/updating.md), [Wings](../wings/updating.md) and
[DB Agent](../db-agent/updating.md) updating guides for the mechanics.
:::
