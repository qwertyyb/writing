<template>
  <component :is="tag"
    class="focusable-control"
    ref="el"
    :tabindex="disabled ? null : 0"
    :data-focusable="disabled ? null : 0"
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
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const { el, keydownHandler } = useFocusControl();
</script>