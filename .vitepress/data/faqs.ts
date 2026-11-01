export interface Faq {
  q: string;
  a: string;
}

export const faqs: Faq[] = [
  {
    q: 'How is Calagopus different from Pterodactyl?',
    a: "Calagopus is built in Rust, where Pterodactyl uses PHP. On identical hardware it serves between 116x and 442x Pterodactyl's panel API throughput, depending on the CPU quota, and Rust rules out whole classes of memory-safety bugs. There is a migration guide for existing Pterodactyl installs.",
  },
  {
    q: 'What games does Calagopus support?',
    a: 'Calagopus uses eggs to describe how a game is installed and started. Anything that runs in a Linux Docker container can be managed, including Minecraft (Java and Bedrock), Rust, ARK, Valheim, FiveM, and many more.',
  },
  {
    q: 'Is Calagopus free to use?',
    a: 'Yes, for personal and commercial use. No features are held back for a paid tier, and the core components are MIT-licensed.',
  },
  {
    q: 'Can I migrate from Pterodactyl or Pelican?',
    a: 'Yes. The panel has a built-in importer for both Pterodactyl and Pelican, and the docs have a migration guide for each.',
  },
  {
    q: 'Does Calagopus have an Extension API?',
    a: 'Yes. Extensions are written against a Rust trait API and can add backend logic, custom routes, UI elements and database migrations.',
  },
  {
    q: 'Can I run Calagopus on a Raspberry Pi?',
    a: 'Yes. Calagopus supports ARM64, and the Docker Compose setup runs on a Raspberry Pi without changes.',
  },
];
