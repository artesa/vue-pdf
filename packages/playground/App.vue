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
      :scale="1"
      :pdf="pdf"
      :virtual-scale="4"
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
