export interface Faq {
  q: string;
  a: string;
}

export const faqs: Faq[] = [
  {
    q: 'How is Calagopus different from Pterodactyl?',
    a: "Calagopus is built in Rust, where Pterodactyl uses PHP. On identical hardware it serves between 108x and 447x Pterodactyl's panel API throughput, depending on the CPU quota, along with Rust's memory-safety guarantees. We provide a migration guide for existing Pterodactyl users.",
  },
  {
    q: 'What games does Calagopus support?',
    a: 'Calagopus uses an egg system to support arbitrary games. Anything that runs in a Linux Docker container can be managed, including Minecraft (Java and Bedrock), Rust, ARK, Valheim, FiveM, and many more.',
  },
  {
    q: 'Is Calagopus free to use?',
    a: 'Yes. Calagopus is free for both personal and commercial use, with no feature gating. Core components are MIT-licensed.',
  },
  {
    q: 'Can I migrate from Pterodactyl or Pelican?',
    a: 'Yes. Calagopus provides migration tooling and documentation for both Pterodactyl and Pelican.',
  },
  {
    q: 'Does Calagopus have an Extension API?',
    a: 'Yes. The Extension API uses Rust traits for type safety and performance. Extensions can add backend logic, custom routes, UI elements, database migrations, and more.',
  },
  {
    q: 'Can I run Calagopus on a Raspberry Pi?',
    a: 'Yes. Calagopus supports ARM64 and the Docker Compose setup works on a Raspberry Pi out of the box.',
  },
];
