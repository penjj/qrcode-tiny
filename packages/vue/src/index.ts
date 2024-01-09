import type { PropType } from 'vue'
import { defineComponent, h, ref, watch } from 'vue'
import type { InlineConfig } from 'qrcode-tiny'
import { createQrCode } from 'qrcode-tiny'

export const QrCode = defineComponent(
  {
    props: {
      text: {
        type: String,
        required: true,
      },
      ecc: {
        type: Object as PropType<InlineConfig['ecc']>,
      },
      width: {
        type: Number,
      },
      height: {
        type: Number,
      },
      dark: {
        type: String,
      },
      light: {
        type: String,
      },
    },
    setup: (props) => {
      const src = ref<string>()

      watch(props, async ({ text, ecc, ...option }) => {
        console.log(text, ecc, option)
        src.value = await createQrCode(text, ecc, option)
      }, {
        immediate: true,
      })

      return () =>
        h('img', { src: src.value })
    },
  },
)
