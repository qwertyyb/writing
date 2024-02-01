<template>
  <component :is="tag"
    class="focusable-control"
    ref="el"
    tabindex="0"
    data-focusable
    @keydown="keydownHandler">
    <slot></slot>
  </component>
</template>

<script lang="ts" setup>
import { useFocusControl } from '@/hooks/focus';

defineProps({
  tag: {
    type: String,
    default: 'div'
  }
})

const { el, keydownHandler } = useFocusControl();
</script>