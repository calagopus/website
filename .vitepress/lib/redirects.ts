// Published URLs have to keep working. When a page moves, add its old route here.
// Images only need an entry when they're deleted, and can point at the page section they showed.
export const movedPages: Record<string, string> = {
  '/docs/about/mcp-server': '/docs/integrations/docs-mcp',
  '/docs/additional/reverse-proxies/index': '/docs/additional/reverse-proxies',
  '/docs/additional/reverse-proxies/panel': '/docs/panel/next-steps/reverse-proxy',
  '/docs/additional/reverse-proxies/wings': '/docs/wings/next-steps/reverse-proxy',
  '/docs/panel/installation/images/first-vps/backup.webp': '/docs/panel/installation/first-vps#back-up-your-vps',
  '/docs/panel/installation/images/first-vps/eula.webp': '/docs/panel/installation/first-vps#_7-create-the-server',
};

export function movedPageLocation(pathname: string, search = ''): string | null {
  const [, route, extension] = pathname.match(/^(.+?)(\.md|\.html)?\/?$/) ?? [];
  if (!route || !Object.hasOwn(movedPages, route)) return null;

  const [page, anchor] = movedPages[route].split('#');
  return `${page}${extension === '.md' ? '.md' : ''}${search}${anchor ? `#${anchor}` : ''}`;
}
