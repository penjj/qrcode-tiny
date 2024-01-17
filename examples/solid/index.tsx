import { render } from 'solid-js/web'
import QrCode from '@qrcode-tiny/solid'
import type { Component } from 'solid-js'

const App: Component = () => (
  <QrCode text="hello solid-js!" width={200} height={200} />
)

render(() => <App />, document.getElementById('app')!)
