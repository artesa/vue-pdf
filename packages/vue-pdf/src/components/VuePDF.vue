<!-- eslint-disable no-case-declarations -->
<script setup lang="ts">
import * as PDFJS from "pdfjs-dist";
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  toRaw,
  watch,
  readonly,
  shallowReactive,
} from "vue";

import type {
  PDFDocumentLoadingTask,
  PDFPageProxy,
  PageViewport,
  RenderTask,
} from "pdfjs-dist";
import type {
  GetViewportParameters,
  PDFDocumentProxy,
  RenderParameters,
} from "pdfjs-dist/types/src/display/api";
import type {
  AnnotationEventPayload,
  HighlightEventPayload,
  HighlightOptions,
  LoadedEventPayload,
  TextLayerLoadedEventPayload,
  WatermarkOptions,
} from "./types";

import AnnotationLayer from "./layers/AnnotationLayer.vue";
import TextLayer from "./layers/TextLayer.vue";
import XFALayer from "./layers/XFALayer.vue";

interface InternalProps {
  page: PDFPageProxy | undefined;
  document: PDFDocumentProxy | undefined;
  viewport: PageViewport | undefined;
}

export interface PartialViewbox {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

const props = withDefaults(
  defineProps<{
    pdf?: PDFDocumentLoadingTask;
    page?: number;
    scale?: number;
    rotation?: number;
    fitParent?: boolean;
    width?: number;
    height?: number;
    textLayer?: boolean;
    autoDestroy?: boolean;
    imageResourcesPath?: string;
    hideForms?: boolean;
    intent?: string;
    annotationLayer?: boolean;
    annotationsFilter?: string[];
    annotationsMap?: object;
    watermarkText?: string;
    watermarkOptions?: WatermarkOptions;
    highlightText?: string | string[];
    highlightOptions?: HighlightOptions;
    highlightPages?: number[];
    partialViewbox?: PartialViewbox;
    virtualScale?: number;
    devicePixelRatio?: number;
  }>(),
  {
    page: 1,
    scale: 1,
    intent: "display",
    autoDestroy: false,
  }
);

const emit = defineEmits<{
  (event: "annotation", payload: AnnotationEventPayload): void;
  (event: "highlight", payload: HighlightEventPayload): void;
  (event: "loaded", payload: LoadedEventPayload): void;
  (event: "textLoaded", payload: TextLayerLoadedEventPayload): void;
  (event: "annotationLoaded", payload: any[]): void;
  (event: "xfaLoaded"): void;
}>();

// Template Refs
const container = ref<HTMLSpanElement>();
const loadingLayer = ref<HTMLSpanElement>();
const loading = ref(false);
let renderTask: RenderTask;

const internalProps = shallowReactive<InternalProps>({
  viewport: undefined,
  document: undefined,
  page: undefined,
});
const alayerProps = computed(() => {
  return {
    annotationsMap: props.annotationsMap,
    annotationsFilter: props.annotationsFilter,
    imageResourcesPath: props.imageResourcesPath,
    hideForms: props.hideForms,
    intent: props.intent,
  };
});
const tlayerProps = computed(() => {
  return {
    highlightText: props.highlightText,
    highlightOptions: props.highlightOptions,
    highlightPages: props.highlightPages,
  };
});

const devicePixelRation = computed(() => props.devicePixelRatio ?? window.devicePixelRatio ?? 1);

function getWatermarkOptionsWithDefaults(): WatermarkOptions {
  return Object.assign(
    {},
    {
      columns: 4,
      rows: 4,
      rotation: 45,
      fontSize: 18,
      color: "rgba(211, 210, 211, 0.4)",
    },
    props.watermarkOptions
  );
}

function getRotation(rotation: number): number {
  if (!(typeof rotation === "number" && rotation % 90 === 0)) return 0;
  const factor = rotation / 90;
  if (factor > 4) return getRotation(rotation - 360);
  else if (factor < 0) return getRotation(rotation + 360);
  return rotation;
}

function getScale(page: PDFPageProxy): number {
  let fscale = props.scale;
  if (props.fitParent) {
    const parentWidth: number = (container.value!.parentNode! as HTMLElement)
      .clientWidth;
    const scale1Width = page.getViewport({ scale: 1 }).width;
    fscale = parentWidth / scale1Width;
  } else if (props.width) {
    const scale1Width = page.getViewport({ scale: 1 }).width;
    fscale = props.width / scale1Width;
  } else if (props.height) {
    const scale1Height = page.getViewport({ scale: 1 }).height;
    fscale = props.height / scale1Height;
  }
  return fscale;
}

function paintWatermark(zoomRatio = 1.0) {
  if (!props.watermarkText) return;

  const canvas = getCurrentCanvas();
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const mergeOptions = getWatermarkOptionsWithDefaults();

  const text = props.watermarkText;
  const columns = mergeOptions.columns!;
  const rows = mergeOptions.rows!;
  const numWatermarks = columns * rows;
  const rotation = mergeOptions.rotation!;
  const pixels = mergeOptions.fontSize! * zoomRatio;
  ctx.font = `${pixels}px Trebuchet MS`;
  ctx.fillStyle = mergeOptions.color!;

  for (let i = 0; i < numWatermarks; i++) {
    const x =
      (i % columns) * (canvas.width / columns) + canvas.width / (columns * 2);
    const y =
      Math.floor(i / columns) * (canvas.height / rows) +
      canvas.height / (rows * 2);

    const textWidth = ctx.measureText(text).width;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-rotation * (Math.PI / 180));
    ctx.fillText(text, -textWidth / 2, pixels / 2);
    ctx.restore();
  }
}

function getCurrentCanvas(): HTMLCanvasElement | null {
  let oldCanvas = null;
  container.value?.childNodes.forEach((el) => {
    if ((el as HTMLElement).tagName === "CANVAS") oldCanvas = el;
  });
  return oldCanvas;
}

function setupCanvas(
  viewport: PageViewport,
  virtualViewport?: PageViewport | null,
  partialViewBox?: PartialViewbox
): HTMLCanvasElement {
  let canvas;
  const currentCanvas = getCurrentCanvas()!;
  if (currentCanvas && currentCanvas?.getAttribute("role") === "main") {
    canvas = currentCanvas;
  } else {
    canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.setAttribute("dir", "ltr");
  }

  const widthX = partialViewBox?.width ?? viewport.width;
  const heightY = partialViewBox?.height ?? viewport.height;

  const outputScale = devicePixelRation.value;
  canvas.width = Math.floor(
    viewport.width * outputScale -
      (viewport.width * outputScale - outputScale * widthX)
  );
  canvas.height = Math.floor(
    viewport.height * outputScale -
      (viewport.height * outputScale - outputScale * heightY)
  );

  canvas.style.width = `${Math.floor(
    viewport.width - (viewport.width - widthX)
  )}px`;
  canvas.style.height = `${Math.floor(
    viewport.height - (viewport.height - heightY)
  )}px`;
  canvas.style.marginLeft = `${partialViewBox?.offsetX ?? 0}px`;
  canvas.style.marginTop = `${partialViewBox?.offsetY ?? 0}px`;

  if (virtualViewport) {
    canvas.style.transformOrigin = "top left";
    canvas.style.transform = `scale(${virtualViewport.scale * (1 / viewport.scale)})`;
  } else {
    canvas.style.transform = "";
  }

  // --scale-factor property
  container.value?.style.setProperty(
    "--scale-factor",
    `${virtualViewport?.scale ?? viewport.scale}`
  );
  container.value?.style.setProperty(
    "--user-unit",
    `${virtualViewport?.userUnit ?? viewport.userUnit}`
  );
  container.value?.style.setProperty(
    "--total-scale-factor",
    "calc(var(--scale-factor) * var(--user-unit))"
  );
  container.value?.style.setProperty(
    "width",
    `${Math.floor(virtualViewport?.width ?? viewport.width)}px`
  );
  container.value?.style.setProperty(
    "height",
    `${Math.floor(virtualViewport?.height ?? viewport.height)}px`
  );
  // Also setting dimension properties for load layer
  loadingLayer.value!.style.width = `${Math.floor(virtualViewport?.width ?? viewport.width)}px`;
  loadingLayer.value!.style.height = `${Math.floor(virtualViewport?.height ?? viewport.height)}px`;
  loadingLayer.value!.style.top = "0";
  loadingLayer.value!.style.left = "0";
  loading.value = true;
  return canvas;
}

let animationFrame: ReturnType<typeof requestAnimationFrame> | null = null;

function cancelRender() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  if (renderTask) renderTask.cancel();
}

function renderPage(pageNum: number) {
  toRaw(internalProps.document)
    ?.getPage(pageNum)
    .then((page) => {
      cancelRender();

      animationFrame = requestAnimationFrame(() => {
        const defaultViewport = page.getViewport();
        const viewportParams: GetViewportParameters = {
          scale: getScale(page),
          rotation: getRotation(
            (props.rotation || 0) + defaultViewport.rotation
          ),
          offsetX: -(props.partialViewbox?.offsetX ?? 0),
          offsetY: -(props.partialViewbox?.offsetY ?? 0),
        };
        const viewport = page.getViewport(viewportParams);
        let virtualViewport: PageViewport | null = null;
        if (props.virtualScale) {
          const virtualViewportParams = page.getViewport({
            ...viewportParams,
            scale: props.virtualScale,
          });
          virtualViewport = page.getViewport(virtualViewportParams);
        }

        const oldCanvas = getCurrentCanvas();
        const canvas = setupCanvas(
          viewport,
          virtualViewport,
          props.partialViewbox
        );

        const outputScale = devicePixelRation.value;
        const transform =
          outputScale !== 1
            ? [outputScale, 0, 0, outputScale, 0, 0]
            : undefined;

        // Render PDF page into canvas context
        const renderContext: RenderParameters = {
          canvas: canvas,
          viewport,
          annotationMode: props.hideForms
            ? PDFJS.AnnotationMode.ENABLE
            : PDFJS.AnnotationMode.ENABLE_FORMS,
          transform,
          intent: props.intent,
        };

        if (canvas?.getAttribute("role") !== "main") {
          if (oldCanvas) container.value?.replaceChild(canvas, oldCanvas);
        } else {
          canvas.removeAttribute("role");
        }

        internalProps.page = page;
        if (virtualViewport) {
          internalProps.viewport = virtualViewport;
        } else {
          internalProps.viewport = viewport;
        }
        renderTask = page.render(renderContext);
        renderTask.promise
          .then(() => {
            loading.value = false;
            paintWatermark(viewport.scale);
            emit("loaded", internalProps.viewport!);
          })
          .catch(() => {
            // render task cancelled
          });
      });
    });
}

function initDoc(proxy: PDFDocumentLoadingTask) {
  proxy.promise.then(async (document) => {
    internalProps.document = document;
    renderPage(props.page);
  });
}

watch(
  () => props.pdf,
  (pdf, oldPdf) => {
    cancelRender();
    if (oldPdf && oldPdf !== pdf && !props.autoDestroy) {
      oldPdf.destroy();
    }
    // For any changes on pdf, reinicialize all
    if (pdf !== undefined) initDoc(pdf);
  }
);

watch(
  () => [
    props.scale,
    props.width,
    props.height,
    props.rotation,
    props.page,
    props.hideForms,
    props.intent,
    props.partialViewbox,
    props.virtualScale,
    devicePixelRation.value
  ],
  () => {
    // Props that should dispatch an render task
    renderPage(props.page);
  }
);

onMounted(() => {
  if (props.pdf !== undefined) initDoc(props.pdf);
});

onUnmounted(() => {
  // Abort all network process and terminates the worker
  if (props.autoDestroy) props.pdf?.destroy();
});

// Exposed method
function destroy() {
  props.pdf?.destroy();
}

function reload() {
  renderPage(props.page);
}

function cancel() {
  cancelRender();
}

defineExpose({
  reload,
  cancel,
  destroy,
  loading: readonly(loading),
});
</script>

<template>
  <div ref="container" style="position: relative; display: block">
    <canvas dir="ltr" style="display: block" role="main" />
    <slot
      name="canvas-overlay"
      :width="internalProps.viewport?.width"
      :height="internalProps.viewport?.height"
    />
    <AnnotationLayer
      v-if="annotationLayer"
      v-bind="{ ...internalProps, ...alayerProps }"
      @annotation="emit('annotation', $event)"
      @annotation-loaded="emit('annotationLoaded', $event)"
    />
    <TextLayer
      v-if="textLayer"
      v-bind="{ ...internalProps, ...tlayerProps }"
      @highlight="emit('highlight', $event)"
      @text-loaded="emit('textLoaded', $event)"
    />
    <XFALayer v-bind="{ ...internalProps }" @xfa-loaded="emit('xfaLoaded')" />
    <div v-show="loading" ref="loadingLayer" style="position: absolute">
      <slot />
    </div>
    <slot
      name="overlay"
      :width="internalProps.viewport?.width"
      :height="internalProps.viewport?.height"
    />
  </div>
</template>
