<template>
  <div class="divider-block" tabindex="0" data-focusable
    @keydown.backspace="$emit('remove')"
    @keydown.enter="$emit('add', { type: 'text' })">
    <hr>
  </div>
</template>

<script lang="ts" setup>
</script>