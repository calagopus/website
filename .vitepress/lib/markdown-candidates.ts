export function markdownCandidates(pathname: string): string[] {
  if (pathname.endsWith('.md')) return [pathname, `${pathname.slice(0, -3)}/index.md`];
  const clean = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (clean === '') return ['/index.md'];
  return [`${clean}.md`, `${clean}/index.md`];
}
