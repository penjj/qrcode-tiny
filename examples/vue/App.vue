<template>
  <QrCode text="hello vue!" :width="200" :height="200" />
</template>

<script setup lang="ts">
import QrCode from '@qrcode-tiny/vue'
</script>