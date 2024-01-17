<script lang="ts" setup>
import { ref, watch } from 'vue'
import type { Ecc } from 'qrcode-tiny'
import { createQrCode } from 'qrcode-tiny'

const src = ref<string>()

const props = defineProps<{
  text: string,
  ecc?: Ecc,
  width?: number
  height?: number
  dark?: string
  light?: string
}>()

watch(props, async ({ text, ecc, ...option }) => {
  src.value = await createQrCode(text, ecc, option)
}, {
  immediate: true,
})
</script>

<template>
  <img :src="src" :width="width" :height="height" />
</template>