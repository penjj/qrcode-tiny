<script lang="ts">
  import { onMount } from "svelte"
  import { createQrCode, type InlineConfig } from "qrcode-tiny"
  import { afterUpdate } from "svelte"

  type $$Props = InlineConfig

  let src: string

  onMount(() => {
    updateQrCodeSrc()
  });

  afterUpdate(() => {
    updateQrCodeSrc()
  });

  async function updateQrCodeSrc() {
    const { text, ecc, ...option } = $$props
    src = await createQrCode(text, ecc, option)
  }
</script>

<img {src} alt="Scan me" />
