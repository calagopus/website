<script setup lang="ts">
import {
  faArrowsRotate,
  faChevronLeft,
  faChevronRight,
  faExpand,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faRotateLeft,
  faRotateRight,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { useRoute } from 'vitepress';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

interface Item {
  src?: string;
  svg?: SVGSVGElement;
  title: string;
  width: number;
  height: number;
}

const ROOT = '.vp-doc';
const IGNORE = '[data-viewer-ignore], .no-viewer';
const SVG_MIN_AREA = 100 * 100;
const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const ZOOM_STEP = 1.25;

const route = useRoute();

const items = ref<Item[]>([]);
const index = ref(0);
const open = ref(false);
const loaded = ref(false);
const scale = ref(1);
const fitScale = ref(1);
const x = ref(0);
const y = ref(0);
const rotation = ref(0);
const dragging = ref(false);

const canvas = ref<HTMLElement | null>(null);
const svgHost = ref<HTMLElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);

const current = computed(() => items.value[index.value]);
const percent = computed(() => `${Math.round(scale.value * 100)}%`);
const transform = computed(
  () =>
    `translate(-50%, -50%) translate(${x.value}px, ${y.value}px) rotate(${rotation.value}deg) scale(${scale.value})`,
);

let restoreFocus: HTMLElement | null = null;
const pointers = new Map<number, { x: number; y: number }>();
let pinch: { distance: number; scale: number } | null = null;

const imageUrl = (img: HTMLImageElement) => img.dataset.viewerSrc || img.currentSrc || img.src;

const isViewableImage = (img: HTMLImageElement) =>
  !!imageUrl(img) &&
  img.getAttribute('alt') !== '' &&
  !img.closest(`a[href], ${IGNORE}`) &&
  img.getClientRects().length > 0;

const outermostSvg = (el: Element) => {
  let svg = el.closest('svg');
  while (svg?.ownerSVGElement) svg = svg.ownerSVGElement;
  return svg;
};

const isViewableSvg = (svg: SVGSVGElement) => {
  if (svg.getAttribute('aria-hidden') === 'true') return false;
  if (svg.closest(`a, button, [role="button"], label, summary, ${IGNORE}`)) return false;
  const { width, height } = svg.getBoundingClientRect();
  return width * height >= SVG_MIN_AREA;
};

const toItem = (img: HTMLImageElement): Item => ({
  src: imageUrl(img),
  title: img.alt || img.title || 'Image',
  width: img.naturalWidth || img.width,
  height: img.naturalHeight || img.height,
});

function fit() {
  const item = current.value;
  const box = canvas.value?.getBoundingClientRect();
  if (!item || !box || !item.width || !item.height) return;

  const turned = rotation.value % 180 !== 0;
  const width = turned ? item.height : item.width;
  const height = turned ? item.width : item.height;
  fitScale.value = Math.min(item.svg ? 4 : 1, (box.width - 32) / width, (box.height - 32) / height);
  scale.value = fitScale.value;
  x.value = 0;
  y.value = 0;
}

async function show(list: Item[], start: number) {
  restoreFocus = document.activeElement as HTMLElement | null;
  items.value = list;
  index.value = start;
  rotation.value = 0;
  open.value = true;
  document.documentElement.classList.add('image-viewer-open');
  document.getElementById('app')?.setAttribute('inert', '');
  await nextTick();
  closeButton.value?.focus({ focusVisible: false } as FocusOptions);
  await load();
}

function close() {
  if (!open.value) return;
  open.value = false;
  pointers.clear();
  pinch = null;
  document.documentElement.classList.remove('image-viewer-open');
  document.getElementById('app')?.removeAttribute('inert');
  restoreFocus?.focus();
  restoreFocus = null;
}

async function load() {
  loaded.value = false;
  const item = current.value;
  if (!item) return;

  if (item.svg) {
    await nextTick();
    svgHost.value?.replaceChildren(item.svg);
  } else if (item.src && (!item.width || !item.height)) {
    const probe = new Image();
    probe.src = item.src;
    await probe.decode().catch(() => undefined);
    item.width = probe.naturalWidth;
    item.height = probe.naturalHeight;
  }

  await nextTick();
  fit();
  loaded.value = true;
}

function go(step: number) {
  if (items.value.length < 2) return;
  index.value = (index.value + step + items.value.length) % items.value.length;
  rotation.value = 0;
  void load();
}

function zoomTo(next: number, originX = 0, originY = 0) {
  const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
  const ratio = clamped / scale.value;
  x.value = originX - (originX - x.value) * ratio;
  y.value = originY - (originY - y.value) * ratio;
  scale.value = clamped;
}

function canvasPoint(event: { clientX: number; clientY: number }) {
  const box = canvas.value!.getBoundingClientRect();
  return { x: event.clientX - box.left - box.width / 2, y: event.clientY - box.top - box.height / 2 };
}

function rotate(step: number) {
  rotation.value += step;
  fit();
}

function toggleActualSize(event?: MouseEvent) {
  const point = event ? canvasPoint(event) : { x: 0, y: 0 };
  if (Math.abs(scale.value - 1) < 0.01) fit();
  else zoomTo(1, point.x, point.y);
}

function onWheel(event: WheelEvent) {
  const point = canvasPoint(event);
  zoomTo(scale.value * Math.exp(-event.deltaY * 0.0015), point.x, point.y);
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return;
  canvas.value?.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  dragging.value = true;

  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: scale.value };
  }
}

function onPointerMove(event: PointerEvent) {
  const previous = pointers.get(event.pointerId);
  if (!previous) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const middle = canvasPoint({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
    x.value += (event.clientX - previous.x) / 2;
    y.value += (event.clientY - previous.y) / 2;
    zoomTo((pinch.scale * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.distance, middle.x, middle.y);
    return;
  }

  x.value += event.clientX - previous.x;
  y.value += event.clientY - previous.y;
}

function onPointerUp(event: PointerEvent) {
  pointers.delete(event.pointerId);
  if (pointers.size < 2) pinch = null;
  if (pointers.size === 0) dragging.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value) return;

  const actions: Record<string, () => void> = {
    Escape: close,
    ArrowLeft: () => go(-1),
    ArrowRight: () => go(1),
    '+': () => zoomTo(scale.value * ZOOM_STEP),
    '=': () => zoomTo(scale.value * ZOOM_STEP),
    '-': () => zoomTo(scale.value / ZOOM_STEP),
    '0': fit,
  };

  const action = actions[event.key];
  if (!action) return;
  event.preventDefault();
  action();
}

function onDocumentClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const target = event.target as Element | null;
  const root = target?.closest(ROOT);
  if (!target || !root) return;

  if (target instanceof HTMLImageElement) {
    if (!isViewableImage(target)) return;
    const gallery = [...root.querySelectorAll('img')].filter(isViewableImage);
    event.preventDefault();
    void show(gallery.map(toItem), gallery.indexOf(target));
    return;
  }

  const svg = outermostSvg(target);
  if (!svg || !isViewableSvg(svg)) return;
  event.preventDefault();

  const { width, height } = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.style.removeProperty('max-width');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  const title = svg.getAttribute('aria-label') || svg.querySelector('title')?.textContent || 'Diagram';
  void show([{ svg: clone, title, width, height }], 0);
}

function onDocumentPointerOver(event: PointerEvent) {
  const target = event.target as Element | null;
  if (!target?.closest(ROOT) || target instanceof HTMLImageElement) return;
  const svg = outermostSvg(target);
  if (svg && !svg.style.cursor && isViewableSvg(svg)) svg.style.cursor = 'zoom-in';
}

function onResize() {
  if (open.value) fit();
}

watch(() => route.path, close);

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('pointerover', onDocumentPointerOver);
  document.addEventListener('keydown', onKeydown);
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  close();
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('pointerover', onDocumentPointerOver);
  document.removeEventListener('keydown', onKeydown);
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="image-viewer">
      <div v-if="open" class="image-viewer" role="dialog" aria-modal="true" aria-labelledby="image-viewer-title">
        <div class="overlay" @click="close" />
        <section class="content">
          <header class="header">
            <h2 id="image-viewer-title" class="title">{{ current?.title }}</h2>
            <span v-if="items.length > 1" class="counter">{{ index + 1 }} / {{ items.length }}</span>
            <div class="controls">
              <template v-if="items.length > 1">
                <button type="button" class="action" aria-label="Previous image" @click="go(-1)">
                  <FontAwesomeIcon :icon="faChevronLeft" />
                </button>
                <button type="button" class="action" aria-label="Next image" @click="go(1)">
                  <FontAwesomeIcon :icon="faChevronRight" />
                </button>
                <span class="divider" />
              </template>
              <button type="button" class="action" aria-label="Zoom out" @click="zoomTo(scale / ZOOM_STEP)">
                <FontAwesomeIcon :icon="faMagnifyingGlassMinus" />
              </button>
              <button type="button" class="zoom" aria-label="Toggle actual size" @click="toggleActualSize()">
                {{ percent }}
              </button>
              <button type="button" class="action" aria-label="Zoom in" @click="zoomTo(scale * ZOOM_STEP)">
                <FontAwesomeIcon :icon="faMagnifyingGlassPlus" />
              </button>
              <button type="button" class="action" aria-label="Fit to screen" @click="fit">
                <FontAwesomeIcon :icon="faExpand" />
              </button>
              <span class="divider" />
              <button type="button" class="action" aria-label="Rotate left" @click="rotate(-90)">
                <FontAwesomeIcon :icon="faRotateLeft" />
              </button>
              <button type="button" class="action" aria-label="Rotate right" @click="rotate(90)">
                <FontAwesomeIcon :icon="faRotateRight" />
              </button>
              <button
                type="button"
                class="action"
                aria-label="Reset"
                @click="
                  rotation = 0;
                  fit();
                "
              >
                <FontAwesomeIcon :icon="faArrowsRotate" />
              </button>
              <button ref="closeButton" type="button" class="close" aria-label="Close" @click="close">
                <FontAwesomeIcon :icon="faXmark" />
              </button>
            </div>
          </header>
          <div
            ref="canvas"
            class="canvas"
            :data-dragging="dragging ? '' : undefined"
            @wheel.prevent="onWheel"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @dblclick="toggleActualSize"
          >
            <div v-show="loaded" class="stage" :style="{ transform }">
              <div v-if="current?.svg" ref="svgHost" class="svg-host" />
              <img
                v-else-if="current?.src"
                :key="current.src"
                :src="current.src"
                :alt="current.title"
                :width="current.width"
                :height="current.height"
                draggable="false"
              />
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
html.image-viewer-open {
  overflow: hidden;
}

.vp-doc img:not(a[href] img, [alt=''], .no-viewer, [data-viewer-ignore] img) {
  cursor: zoom-in;
}
</style>

<style scoped>
.image-viewer {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5dvh 5vw;
}

.overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
}

.content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--mantine-radius-default);
  background-color: var(--mantine-color-body);
  box-shadow: var(--mantine-shadow-xl);
}

.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mantine-spacing-xs) var(--mantine-spacing-sm);
  min-height: 60px;
  padding: var(--mantine-spacing-md);
  padding-inline-end: calc(var(--mantine-spacing-md) - 5px);
}

.title {
  flex: 1 1 12rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
  overflow: hidden;
  font-size: var(--mantine-font-size-md);
  font-weight: var(--mantine-font-weight-regular);
  line-height: 1;
  letter-spacing: normal;
  color: var(--mantine-color-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.counter {
  font-size: var(--mantine-font-size-sm);
  font-variant-numeric: tabular-nums;
  color: var(--mantine-color-dimmed);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-inline-start: auto;
}

.action,
.close,
.zoom {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  border: 1px solid transparent;
  border-radius: var(--mantine-radius-default);
  background-color: transparent;
  cursor: pointer;
  transition: background-color 100ms ease;
}

.action,
.close {
  width: 28px;
  font-size: 14px;
}

.action,
.zoom {
  color: var(--mantine-color-gray-light-color);
}

.close {
  margin-inline-start: var(--mantine-spacing-xs);
  font-size: 18px;
  color: var(--mantine-color-gray-7);
}

.dark .close {
  color: var(--mantine-color-dark-1);
}

.zoom {
  min-width: 3.75rem;
  padding: 0 6px;
  font-size: var(--mantine-font-size-sm);
  font-variant-numeric: tabular-nums;
}

@media (hover: hover) {
  .action:hover,
  .zoom:hover {
    background-color: var(--mantine-color-gray-light-hover);
  }

  .close:hover {
    background-color: var(--mantine-color-gray-0);
  }

  .dark .close:hover {
    background-color: var(--mantine-color-dark-6);
  }
}

.action:focus-visible,
.close:focus-visible,
.zoom:focus-visible {
  outline: 2px solid var(--mantine-primary-color-filled);
  outline-offset: 2px;
}

.divider {
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background-color: var(--mantine-color-default-border);
}

.canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.canvas[data-dragging] {
  cursor: grabbing;
}

.stage {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center;
}

.stage img,
.svg-host {
  display: block;
  max-width: none;
  border-radius: var(--mantine-radius-default);
}

.image-viewer-enter-active,
.image-viewer-leave-active {
  transition: opacity 200ms ease;
}

.image-viewer-enter-active .content,
.image-viewer-leave-active .content {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.image-viewer-enter-from,
.image-viewer-leave-to {
  opacity: 0;
}

.image-viewer-enter-from .content,
.image-viewer-leave-to .content {
  opacity: 0;
  transform: translateY(-30px);
}

@media (prefers-reduced-motion: reduce) {
  .image-viewer-enter-active,
  .image-viewer-leave-active,
  .image-viewer-enter-active .content,
  .image-viewer-leave-active .content {
    transition: none;
  }
}
</style>
