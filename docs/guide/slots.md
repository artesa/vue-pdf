# Slots

## loading: default

Content to display when page is rendering

```vue
<template>
  <VuePDF :pdf="pdf">
    <div>
      Loading...
    </div>
  </VuePDF>
</template>
```

## overlay

Enable to add overlay content. This overlay gets placed after all other elements.

```vue
<template>
  <VuePDF :pdf="pdf">
    <template #overlay="{ width, height }" >
      <div>
        Page size {{ width }}x{{ height }}
      </div>
    </template>
  </VuePDF>
</template>
```

::: warning
DO NOT ADD a `<canvas>` element as root of template since it can break the component when page reload on scaling, rotating, etc.
:::

## canvas-overlay

Same as [overlay](#overlay), but this overlay gets placed between the canvas and the other layers.