import type { Component } from 'solid-js'
import QrCode from '@qrcode-tiny/solid'
import { render } from 'solid-js/web'

const App: Component = () => (
  <QrCode text="hello solid-js!" width={200} height={200} />
)

render(() => <App />, document.getElementById('app')!)
