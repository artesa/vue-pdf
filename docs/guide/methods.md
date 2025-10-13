# Methods

## reload

Reload page's render task, useful to update some props, for example, the parent width when [`fit-parent`](./props.html#fit-parent) is used

```vue
<script setup>
import { useTemplateRef } from 'vue'

const VPDF = useTemplateRef("VPDF")
function someEvent() {
  VPDF.value.reload()
}
</script>

<template>
  <VuePDF ref="VPDF" :pdf="pdf" />
</template>
```

## cancel

Cancel the render task if the page is currently rendering.

```vue
<script setup>
import { useTemplateRef } from 'vue'

const VPDF = useTemplateRef("VPDF")
function someEvent() {
  VPDF.value.cancel()
}
</script>

<template>
  <VuePDF ref="VPDF" :pdf="pdf" />
</template>
```

## loading

Readonly reactive value indicating if the page is loading.

```vue
<script setup>
import { computed, useTemplateRef } from 'vue'

const VPDF = useTemplateRef("VPDF")

const pageIsLoading = computed(() => VPDF.value.loading);
</script>

<template>
  <VuePDF ref="VPDF" :pdf="pdf" />
</template>
```