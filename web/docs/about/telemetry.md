---
title: Telemetry
description: What Calagopus panels report, what this site publishes from it, what is never published, and how to turn telemetry off.
---

<script setup>
import TelemetryStats from '../../../.vitepress/components/TelemetryStats.vue'
</script>

# Telemetry

Calagopus panels report a small daily summary of what they are running. This page shows
what comes out of that, lists every field that goes in, and explains how to turn the
reporting off.

Only two kinds of figure are published: totals, and how those totals move over time.
There is no breakdown by version, operating system, extension or country, and nothing
identifies a panel.

## What is published

<TelemetryStats />

That is all of it. Everything else panels report stays internal to the project (for now).

## What each panel sends

A panel with telemetry enabled sends one submission a day, at a randomized time, to
`https://calagopus.com/api/telemetry`:

| Field                  | Contents                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `uuid`                 | A random identifier generated once per panel, so repeated submissions can be deduplicated                                      |
| `panel`                | Panel version, container image type, database and cache version, CPU architecture, kernel version                              |
| `resources`            | Total counts of users, servers and backups, a count of users per interface language, and a count of backups per storage target |
| `nodes`                | Per node: Wings version, container image type, architecture, kernel version, memory totals, and server counts                  |
| `database_agent_hosts` | The same shape as `nodes`, for database agent hosts                                                                            |
| `extensions`           | Installed extensions: package name, display name, description, authors, version, and whether a license is bundled              |

The receiving server adds two more things the panel does not send: the country the
submission arrived from, derived from the connecting IP, and the time it arrived. The IP
address itself is used for rate limiting and that country lookup, then discarded.

Admins can see the exact payload their own panel would send under
**Settings → Preview Telemetry**, which needs the `stats.read` permission. The preview
covers the panel's own payload, so the two server-side fields are not in it.

## What is never published

Most of what panels report is useful to the project in aggregate but does not appear
anywhere on this site or in the API:

- The panel identifier, in any form. It is not hashed or truncated into a published
  figure, and no endpoint accepts one. Nothing here can look up an individual panel or
  confirm that a particular panel reports at all.
- Versions, whether panel, Wings, database or cache. A public version split is a map of
  which deployments are running something with a known fix available. Panels built from a
  git checkout also report `version:commit@branch`, and a branch name can give away an
  unreleased internal project.
- Extensions. Package names are reverse-DNS (`tld.author.ident`), so the package name
  identifies whoever wrote a private extension about as well as the display name does.
  Neither those names nor the number of extensions installed is published.
- Operating systems and kernels. Kernel versions arrive verbatim and carry the
  distribution build and patch level.
- Country. It is collected for abuse handling. Since a panel's own telemetry preview does
  not show it, publishing a country breakdown would go past what operators are shown.
- Anything per panel: no maximum, no distribution, no per-panel row. The largest
  deployment in the fleet is not a public figure, and neither is the shape of the fleet
  around it.
- Submission times. The daily submission time is randomized per panel and then stays put,
  which makes it a fingerprint. Nothing finer than the calendar day is used.

## Turning it off

Telemetry is on by default. To turn it off, open
[**Settings → Telemetry**](/docs/panel/features/admin/settings) in the admin area and
disable **Enable Telemetry**. The panel stops reporting immediately, and no further
submissions from it enter the aggregate.

Submissions already received expire on their own after two years.
