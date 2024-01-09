import { expect, it } from 'vitest'

import { encodeText } from './qrcode'
import { EccHigh, EccLow, EccMedium, EccQuartile } from './constants'

it('should match snapshot', () => {
  expect(encodeText('Hello 你好', EccHigh).modules).toMatchSnapshot()
  expect(encodeText('Hello 你好', EccQuartile).modules).toMatchSnapshot()
  expect(encodeText('Hello 你好', EccMedium).modules).toMatchSnapshot()
  expect(encodeText('Hello 你好', EccLow).modules).toMatchSnapshot()
  expect(encodeText('', EccLow).modules).toMatchSnapshot()
})

// import { Ecc } from "./ecc";
// import { QrCode } from "./qrcode";

// const data = EncodeText("hello 彭佳俊", Ecc._HIGH)._modules;
// const wrapper = document.querySelector<HTMLElement>(".qrcode");

// const drawer = createCanvasDrawer(wrapper!, {
//   width: 200,
//   height: 200,
//   colorLight: "#fff",
//   colorDark: "#000",
// });
// drawer.draw(data);
// drawer.makeImage();

// export function createCanvasDrawer(el: HTMLElement, option: any) {
//   let isPainted = false;
//   const canvas = document.createElement("canvas");
//   const img = document.createElement("img");
//   canvas.width = option.width;
//   canvas.height = option.height;
//   img.hidden = true;
//   el.append(canvas, img);

//   const context = canvas.getContext("2d")!;

//   const clear = () => {
//     context.clearRect(0, 0, canvas.width, canvas.height);
//     isPainted = false;
//   };

//   const draw = (oQRCode: boolean[][]) => {
//     const len = oQRCode.length;
//     var nWidth = option.width / len;
//     var nHeight = option.height / len;
//     var nRoundedWidth = round(nWidth);
//     var nRoundedHeight = round(nHeight);

//     img.hidden = true;
//     clear();

//     oQRCode.forEach((row, rowIndex) => {
//       row.forEach((isDark, colIndex) => {
//         const colorStyle = isDark ? option.colorDark : option.colorLight;
//         const nLeft = colIndex * nWidth;
//         const nTop = rowIndex * nHeight;
//         context.strokeStyle = colorStyle;
//         context.fillStyle = colorStyle;
//         context.fillRect(nLeft, nTop, nWidth, nHeight);
//         context.strokeRect(
//           ceil(nLeft) - 0.5,
//           ceil(nTop) - 0.5,
//           nRoundedWidth,
//           nRoundedHeight
//         );
//       });
//     });

//     isPainted = true;
//   };

//   const makeImage = () => {
//     if (isPainted) {
//       img.src = canvas.toDataURL("image/png");
//       img.hidden = false;
//       canvas.hidden = true;
//     }
//   };

//   return {
//     clear,
//     draw,
//     makeImage,
//   };
// }
