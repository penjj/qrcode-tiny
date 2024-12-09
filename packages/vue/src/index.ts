import type { Ecc } from 'qrcode-tiny'
import type { PropType } from 'vue'
import { createQrCode } from 'qrcode-tiny'
import { defineComponent, h, ref, watch } from 'vue'

export default defineComponent({
  name: 'QrCodeTiny',
  props: {
    text: {
      type: String,
      required: true,
    },
    ecc: {
      type: Object as PropType<Ecc>,
      default: undefined,
    },
    width: {
      type: Number,
      default: 200,
    },
    height: {
      type: Number,
      default: 200,
    },
    dark: {
      type: String,
      default: '#000',
    },
    light: {
      type: String,
      default: '#fff',
    },
  },
  setup(props) {
    const src = ref<string>()

    watch(props, async ({ text, ecc, ...option }) => {
      src.value = await createQrCode(text, ecc, option)
    }, {
      immediate: true,
    })

    return () => h('img', {
      src: src.value,
      width: props.width,
      height: props.height,
    })
  },
})
