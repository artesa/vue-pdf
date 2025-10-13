<!-- eslint-disable unused-imports/no-unused-imports -->
<!-- Use this component to play with the main components -->
<script setup lang="ts">
import testPdf from "@samples/AnimagiC_2024_Programmheft_V4.pdf";
import { VuePDF, usePDF } from "@tato30/vue-pdf";

const { pdf } = usePDF(testPdf);
</script>

<template>
  <div style="background-color: black;">
    <VuePDF
      :scale="4"
      :partial-viewbox="{
        offsetX: 100,
        offsetY: 0,
        width: 500,
        height: 500,
      }"
      :pdf="pdf"
      text-layer
    />
  </div>
</template>
