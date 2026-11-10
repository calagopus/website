import type { PluginOption } from 'vite';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const IMAGE_MANIFEST_ROUTE = '/_mcp/images.json';

const MIME_TYPES: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

export interface ManifestImage {
  path: string;
  asset: string;
  mime: string;
  bytes: number;
}

export interface ImageManifest {
  generated_at: string;
  count: number;
  images: ManifestImage[];
}

export function imageMime(file: string): string | undefined {
  return MIME_TYPES[file.split('?')[0].split('.').pop()?.toLowerCase() ?? ''];
}

const emitted = new Map<string, string>();

export function imageAssetsPlugin(): PluginOption {
  return {
    name: 'mcp-image-assets',
    applyToEnvironment: (environment) => environment.name === 'client',

    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'asset' || imageMime(chunk.fileName) === undefined) continue;

        for (const original of chunk.originalFileNames) {
          const source = original.split('?')[0];
          if (!source.startsWith('..') && imageMime(source) !== undefined) {
            emitted.set(`/${source}`, `/${chunk.fileName}`);
          }
        }
      }
    },
  };
}

export async function writeImageManifest(outDir: string): Promise<void> {
  const images = await Promise.all(
    [...emitted]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(async ([path, asset]): Promise<ManifestImage> => {
        const { size } = await stat(join(outDir, asset));
        return { path, asset, mime: imageMime(path) ?? 'application/octet-stream', bytes: size };
      }),
  );

  const manifest: ImageManifest = {
    generated_at: new Date().toISOString(),
    count: images.length,
    images,
  };

  const dest = join(outDir, IMAGE_MANIFEST_ROUTE.replace(/^\//, ''));
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, JSON.stringify(manifest));
}
