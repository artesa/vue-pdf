<script setup lang="ts">
import * as PDFJS from "pdfjs-dist";
import {
  markRaw,
  onMounted,
  onUnmounted,
  shallowRef,
  toRaw,
  useTemplateRef,
  watch,
} from "vue";

import type { PDFDocumentProxy, PDFPageProxy, PageViewport } from "pdfjs-dist";
import type { AnnotationLayerParameters } from "pdfjs-dist/types/src/display/annotation_layer";
import type { IDownloadManager } from "pdfjs-dist/types/web/interfaces";

import {
  EVENTS_TO_HANDLER,
  annotationEventsHandler,
} from "../utils/annotations";
import { SimpleLinkService } from "../utils/link_service";

import type { AnnotationEventPayload } from "../types";

const props = defineProps<{
  page?: PDFPageProxy;
  viewport?: PageViewport;
  document?: PDFDocumentProxy;
  annotationsFilter?: string[];
  annotationsMap?: object;
  imageResourcesPath?: string;
  hideForms?: boolean;
  enableScripting?: boolean;
  intent: string;
}>();

const emit = defineEmits<{
  (event: "annotation", payload: AnnotationEventPayload): void;
  (event: 'annotationRendered'): void;
}>();

const layerRef = useTemplateRef("layer");
const annotations = shallowRef<any[]>();
const annotationLayer = shallowRef<PDFJS.AnnotationLayer>();
const rendered = shallowRef(false);

function annotationsEvents(evt: Event) {
  const value = annotationEventsHandler(
    evt,
    props.document!,
    annotations.value!
  );
  Promise.resolve(value).then((data) => {
    if (data) emit("annotation", data);
  });
}

async function getFieldObjects() {
  const fieldObjects = await toRaw(props.document)?.getFieldObjects();
  return fieldObjects;
}

async function getHasJSActions() {
  const hasJSActions = await toRaw(props.document)?.hasJSActions();
  return hasJSActions;
}

async function getAnnotations() {
  const page = props.page;

  let annotations = await page?.getAnnotations({ intent: props.intent });
  if (props.annotationsFilter) {
    const filters = props.annotationsFilter;
    annotations = annotations!.filter((value) => {
      const subType = value.subtype;
      const fieldType = value.fieldType
        ? `${subType}.${value.fieldType}`
        : null;
      return (
        filters?.includes(subType) ||
        (fieldType !== null && filters?.includes(fieldType))
      );
    });
  }

  return annotations;
}

let abortController: AbortController = new AbortController();

async function render() {
  if (rendered.value && annotationLayer.value) {
    annotationLayer.value.update({
      viewport: props.viewport!,
    } as any);
    return;
  }

  abortController.abort();
  abortController = new AbortController();
  const { signal } = abortController;

  layerRef.value?.replaceChildren?.();
  for (const evtHandler of EVENTS_TO_HANDLER)
    layerRef.value?.removeEventListener(evtHandler, annotationsEvents);

  const doc = toRaw(props.document);

  if (!doc) {
    console.warn("[VuePDF] No document instance found for AnnotationLayer");
    return;
  }

  const page = props.page;
  const viewport = props.viewport;

  const _annotations = await getAnnotations();

  if (signal.aborted) return;

  annotations.value = _annotations ? markRaw(_annotations) : undefined;

  // Canvas map for push button widget
  const canvasMap = new Map<string, HTMLCanvasElement>([]);
  for (const anno of annotations.value!) {
    if (
      anno.subtype === "Widget" &&
      anno.fieldType === "Btn" &&
      anno.pushButton
    ) {
      const canvasWidth = anno.rect[2] - anno.rect[0];
      const canvasHeight = anno.rect[3] - anno.rect[1];
      const subCanvas = document.createElement("canvas");
      subCanvas.setAttribute(
        "width",
        (canvasWidth * viewport!.scale).toString()
      );
      subCanvas.setAttribute(
        "height",
        (canvasHeight * viewport!.scale).toString()
      );
      canvasMap.set(anno.id, subCanvas);
    }
  }
  const annotationStorage = doc.annotationStorage;
  if (props.annotationsMap) {
    for (const [key, value] of Object.entries(props.annotationsMap))
      annotationStorage.setValue(key, value);
  }

  const layerParameters = {
    accessibilityManager: undefined,
    annotationCanvasMap: canvasMap,
    div: layerRef.value!,
    page: page!,
    viewport: viewport!.clone({ dontFlip: true }),
    annotationEditorUIManager: null,
    l10n: null,
    annotationStorage,
    linkService: new SimpleLinkService(),
    commentManager: null,
    structTreeLayer: null,
  };

  const renderParameters: AnnotationLayerParameters = {
    annotations: annotations.value!,
    viewport: viewport!.clone({ dontFlip: true }),
    linkService: new SimpleLinkService(),
    annotationCanvasMap: canvasMap,
    div: layerRef.value!,
    annotationStorage,
    renderForms: !props.hideForms,
    page: page!,
    enableScripting: false,
    hasJSActions: await getHasJSActions(),
    fieldObjects: await getFieldObjects(),
    downloadManager: null as unknown as IDownloadManager,
    imageResourcesPath: props.imageResourcesPath,
  };

  if (signal.aborted) return;

  const annoationLayer = new PDFJS.AnnotationLayer(layerParameters);

  annotationLayer.value = markRaw(annoationLayer);

  const task = annoationLayer.render(renderParameters);
  task.then(async () => {
    if (signal.aborted) return;
    emit('annotationRendered');
    rendered.value = true;
  });

  for (const evtHandler of EVENTS_TO_HANDLER)
    layerRef.value?.addEventListener(evtHandler, annotationsEvents);
}

watch(
  () => props.viewport,
  () => {
    if (props.page && props.viewport && layerRef.value) render();
  }
);

onMounted(() => {
  if (props.page && props.viewport && layerRef.value) render();
});

onUnmounted(() => {
  abortController.abort();
  for (const evtHandler of EVENTS_TO_HANDLER)
    layerRef.value?.removeEventListener(evtHandler, annotationsEvents);

  annotationLayer.value = undefined;
  annotations.value = undefined;
})

defineExpose({
  annotationLayer,
  annotations,
});
</script>

<template>
  <div ref="layer" class="annotationLayer" style="display: block" />
</template>

<style>
.annotationLayer {
  right: 0;
  bottom: 0;
}

/* Make annotation sections available over text layer */
.annotationLayer section {
  z-index: 1 !important;
}
</style>
