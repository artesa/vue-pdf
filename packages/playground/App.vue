<!-- eslint-disable unused-imports/no-unused-imports -->
<!-- Use this component to play with the main components -->
<script setup lang="ts">
import testPdf from "@samples/AnimagiC_2024_Programmheft_V4.pdf";
import { VuePDF, usePDF } from "@tato30/vue-pdf";
import { shallowRef } from "vue";

const { pdf } = usePDF(testPdf);

const scale = shallowRef(1);
</script>

<template>
  <button @click="scale += 0.1">Inc</button>
  <button @click="scale -= 0.1">Dec</button>
  <div style="background-color: black;">
    <VuePDF
      :scale="0.5"
      :pdf="pdf"
      :virtual-scale="scale"
      text-layer
    />
  </div>

  <!-- :partial-viewbox="{
        offsetX: 100,
        offsetY: 0,
        width: 50,
        height: 50,
      }" -->
</template>
