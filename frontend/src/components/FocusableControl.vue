<template>
  <component :is="tag"
    class="focusable-control"
    :tabindex="disabled ? null : 0"
    :data-focusable="disabled ? null : 0">
    <slot></slot>
  </component>
</template>

<script lang="ts" setup>

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
</script>