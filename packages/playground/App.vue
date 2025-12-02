<!-- eslint-disable unused-imports/no-unused-imports -->
<!-- Use this component to play with the main components -->
<script setup lang="ts">
import testPdf from "@samples/annotation text box example edit.pdf";
import {
  VuePDF,
  usePDF,
  getScrollPosition,
  restoreScrollPosition,
} from "@tato30/vue-pdf";
import { shallowRef, useTemplateRef, watch, nextTick } from "vue";

const { pdf } = usePDF(testPdf);

const scale = shallowRef(1);
const realScale = shallowRef(0.5);

const rotation = shallowRef(0);

function rotate() {
  rotation.value = (rotation.value + 90) % 360;
}

const viewerContainer = useTemplateRef("viewerContainer");

let oldScrollPercentage: ReturnType<typeof getScrollPosition>;

watch(
  scale,
  () => {
    oldScrollPercentage = getScrollPosition(viewerContainer.value!);
  },
  { flush: "pre" }
);
watch(scale, async () => {
  await nextTick();

  restoreScrollPosition(viewerContainer.value!, oldScrollPercentage);
});
</script>

<template>
  <button @click="scale += 0.5">Inc V</button>
  <button @click="scale -= 0.5">Dec V</button>
  <button @click="realScale += 0.5">Inc R</button>
  <button @click="realScale -= 0.5">Dec R</button>
  <button @click="rotate">Rotate</button>
  <!-- <button @click="test">Test</button> -->
  <div ref="viewerContainer" class="viewer-container">
    <div class="viewer">
      <VuePDF
        :scale="realScale"
        :pdf="pdf"
        :virtual-scale="scale"
        :rotation="rotation"
        text-layer
        annotation-layer
      />
      <!-- <VuePDF
        :page="2"
        :scale="realScale"
        :pdf="pdf"
        :virtual-scale="scale"
        text-layer
        annotation-layer
      />
      <VuePDF
        :page="3"
        :scale="realScale"
        :pdf="pdf"
        :virtual-scale="scale"
        text-layer
        annotation-layer
      /> -->
    </div>
  </div>

  <!-- :partial-viewbox="{
        offsetX: 100,
        offsetY: 0,
        width: 50,
        height: 50,
      }" -->
</template>

<style scoped>
.viewer-container {
  min-height: 0px;
  overflow: scroll;
  height: 95dvh;
}
.viewer {
  background-color: black;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--default-width), 1fr));
  justify-items: center;
  height: 100%;
}
</style>
