const fs = require("fs");
const { Decoder: PngDecoder, Encoder: PngEncoder } = require("png-stream");
const ColorTransform = require("color-transform");

fs.createReadStream("image.png")
  .pipe(new PngDecoder({ format: "rgba" }))
  .pipe(new ColorTransform("rgba", "graya"))
  .pipe(new PngEncoder({ colorSpace: "graya" }))
  .pipe(fs.createWriteStream("gray-image.png"))
