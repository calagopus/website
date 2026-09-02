import type { Faq } from './faqs.ts';

export const compareFaqs: Record<string, Faq[]> = {
  'compare/calagopus-vs-pterodactyl.md': [
    {
      q: 'Is Calagopus a fork of Pterodactyl?',
      a: "No. Calagopus is a complete rewrite in a different language (Rust vs PHP). It draws on Pterodactyl's concepts - the egg system, Wings architecture, and panel/daemon split - but shares no code.",
    },
    {
      q: 'Does Calagopus support Pterodactyl eggs?',
      a: 'Yes. The egg format is compatible, so eggs from the <a href="https://github.com/parkervcp/eggs" target="_blank" rel="noreferrer">Pterodactyl community</a> and other sources work in Calagopus without modification.',
    },
    {
      q: 'Does Calagopus support Blueprint extensions?',
      a: "No. Blueprint targets Pterodactyl's PHP architecture and isn't compatible with Calagopus. Calagopus's native extension API covers all of the same use cases with better performance, type safety, and upgrade stability.",
    },
    {
      q: 'Can I run both panels simultaneously during migration?',
      a: 'Yes. You can run a Calagopus instance alongside an existing Pterodactyl install, migrate nodes one at a time, and decommission Pterodactyl when ready.',
    },
    {
      q: 'Is Wings compatible between the two?',
      a: 'Calagopus ships its own Wings daemon (also written in Rust). You will need to install the Calagopus-flavored Wings on each node as part of migration. The process is documented in the migration guide.',
    },
  ],
  'compare/calagopus-vs-pelican.md': [
    {
      q: 'Is Calagopus compatible with Pelican eggs?',
      a: "Yes. Pelican inherits Pterodactyl's egg format, and Calagopus is compatible with it. Community eggs from existing repositories work in Calagopus without modification.",
    },
    {
      q: 'Can I use Blueprint extensions with Calagopus?',
      a: 'No. Blueprint only targets Pterodactyl\'s PHP/Laravel internals. Calagopus uses a native Rust extension API instead - see the <a href="/docs/panel/extensions/">extension development guide</a> for how to build extensions for Calagopus.',
    },
    {
      q: 'Does Calagopus use the same Wings as Pelican?',
      a: 'No. Calagopus ships its own Wings daemon, rewritten in Rust. You will need to install Calagopus Wings on each node as part of migration. The migration guide walks through this.',
    },
    {
      q: 'Which panel is easier to set up?',
      a: 'Both panels offer Docker Compose setups that get a panel running in a few commands. Calagopus additionally provides binary and package manager installation options and runs natively on Windows, which can simplify homelab deployments.',
    },
    {
      q: 'Which panel has better performance?',
      a: 'Calagopus, by a significant margin. The Rust-based backend produces over 32,800% higher throughput than PHP-based panels in benchmarks. For small deployments the difference is less critical; for production hosting providers it translates directly to hardware savings.',
    },
  ],
  'compare/index.md': [
    {
      q: 'What is the best Pterodactyl alternative?',
      a: 'It depends on what you want to change. Pelican keeps the PHP stack and adds plugins, OAuth and admin roles. AMP is a paid, closed-source panel with per-game integrations and native Windows support. Calagopus is a Rust rewrite that keeps the egg format and adds performance, an extension API, more database types and deeper administration. The page above maps each to the situations it fits.',
    },
    {
      q: 'Is Pelican just Pterodactyl with a new interface?',
      a: 'No. The Filament interface is the most visible change, but Pelican also adds a first-party plugin system, OAuth and passkey login, admin roles, webhooks and PostgreSQL or SQLite for the panel database. It keeps the PHP runtime, the Go Wings daemon and MySQL-only game-server databases.',
    },
    {
      q: 'Do Pterodactyl eggs work on the alternatives?',
      a: 'Pelican and Calagopus both read the Pterodactyl egg format without modification. AMP does not use eggs; it has its own per-game templates.',
    },
    {
      q: 'Which alternatives are free for commercial hosting?',
      a: 'Pterodactyl (MIT), Pelican (AGPL-3.0) and Calagopus (MIT) can all be used to sell hosting at no cost. AMP requires its Enterprise Edition for commercial reselling.',
    },
    {
      q: 'Can I try an alternative without losing my Pterodactyl setup?',
      a: 'Yes. Calagopus imports users, servers, nodes and eggs from a Pterodactyl database into a fresh install, and both panels can run side by side while you move nodes one at a time. See the <a href="/docs/additional/migrations/pterodactyl">Pterodactyl migration guide</a>.',
    },
  ],
  'compare/pterodactyl-vs-pelican.md': [
    {
      q: 'Is Pelican a fork of Pterodactyl?',
      a: 'Yes. Pelican started in March 2024 as a fork of the Pterodactyl panel. It rebuilt the interface with Filament and added features, but it shares the same PHP/Laravel lineage and uses the Go Wings daemon it inherited.',
    },
    {
      q: 'Is Pelican faster than Pterodactyl?',
      a: 'Not in a way that shows under load. Both panels are PHP applications behind PHP-FPM, so panel throughput is similar. The performance difference between the two and a Rust panel such as Calagopus is documented on the <a href="/docs/about/benchmarks">benchmarks page</a>.',
    },
    {
      q: 'Do Blueprint extensions work on Pelican?',
      a: 'No. Blueprint patches Pterodactyl source files and is not compatible with Pelican. Pelican has its own first-party plugin system, so extensions have to be rebuilt for it.',
    },
    {
      q: 'What does the license change from MIT to AGPL-3.0 mean?',
      a: 'For running the panel, nothing changes. If you modify Pelican and offer the modified panel to users over a network, the AGPL requires you to make your modifications available. Pterodactyl and Calagopus are MIT-licensed and carry no such requirement.',
    },
  ],
  'compare/calagopus-vs-amp.md': [
    {
      q: 'Is Calagopus really free for commercial use?',
      a: 'Yes. The MIT license permits commercial use without restriction and without licensing fees.',
    },
    {
      q: 'Can I use Calagopus for a game hosting business?',
      a: 'Yes. There are no per-node, per-server, or per-user restrictions. You can run Calagopus on as many hosts as you need. Integrations with billing systems like <a href="/docs/integrations/paymenter">Paymenter</a>, <a href="/docs/integrations/whmcs">WHMCS</a>, and <a href="/docs/integrations/blesta">Blesta</a> are available.',
    },
    {
      q: 'Does Calagopus support Minecraft?',
      a: 'Yes. Calagopus supports Minecraft Java Edition, Bedrock Edition, Paper, Fabric, Forge, NeoForge, Velocity, BungeeCord, and other Minecraft-adjacent software via community eggs. See the <a href="/docs/panel/next-steps/egg-repos">egg repositories guide</a> for how to add egg repos to your panel.',
    },
    {
      q: 'Can I migrate from AMP to Calagopus?',
      a: 'There is no automated migration path from AMP to Calagopus - the data models are different. You would need to set up Calagopus fresh and recreate server configurations. This is typically a manageable process for small installations. The <a href="/docs/panel/installation/">installation guide</a> is the starting point.',
    },
    {
      q: 'Does Calagopus have a commercial support option?',
      a: 'Calagopus is community-supported. The <a href="https://discord.gg/uSM8tvTxBV" target="_blank" rel="noreferrer">Discord server</a> is active, and issues can be filed on <a href="https://github.com/calagopus" target="_blank" rel="noreferrer">GitHub</a>. If you need guaranteed SLAs or dedicated support contracts, AMP or a managed hosting solution may be a better fit.',
    },
  ],
};
