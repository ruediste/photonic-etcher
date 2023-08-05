/**
 * Simple function that converts a plain SVG string or SVG DOM Node into an image with custom dimensions.
 *
 * @param {Object} settings The configuration object to override the default settings.
 * @see https://ourcodeworld.com/articles/read/1456/how-to-convert-a-plain-svg-string-or-svg-node-to-an-image-png-or-jpeg-in-the-browser-with-javascript
 * @returns {Promise}
 */
import { CanvasToImage } from "./canvas_to_img";

export type SvgToImageSettings = {
    width: number | 'auto';
    height?: number | 'auto';
    mimetype?: string;
    quality?: number;
}

export function SVGToImage<
    T extends 'blob' | 'img' | 'base64',
    R = T extends 'blob' ? Blob : T extends 'img' ? CanvasImageSource : string>
    (svg: string, outputFormat: T, settings: SvgToImageSettings): Promise<R> {
    let _settings: SvgToImageSettings = {
        // Usually all SVG have transparency, so PNG is the way to go by default
        mimetype: "image/png",
        quality: 1,
        height: "auto",
        ...settings
    };

    return new Promise<R>(function (resolve, reject) {
        let svgNode;

        // Create SVG Node if a plain string has been provided
        if (typeof (svg) == "string") {
            // Create a non-visible node to render the SVG string
            let SVGContainer = document.createElement("div");
            SVGContainer.style.display = "none";
            SVGContainer.innerHTML = svg;
            svgNode = SVGContainer.firstElementChild;
        } else {
            svgNode = svg;
        }

        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');

        let svgXml = new XMLSerializer().serializeToString(svgNode);
        let svgBase64 = "data:image/svg+xml;base64," + btoa(svgXml);

        const image = new Image();

        image.onload = function () {
            let finalWidth, finalHeight;

            // Calculate width if set to auto and the height is specified (to preserve aspect ratio)
            if (_settings.width === "auto" && _settings.height !== "auto") {
                finalWidth = (image.width / image.height) * _settings.height;
                // Use image original width
            } else if (_settings.width === "auto") {
                finalWidth = image.naturalWidth;
                // Use custom width
            } else {
                finalWidth = _settings.width;
            }

            // Calculate height if set to auto and the width is specified (to preserve aspect ratio)
            if (_settings.height === "auto" && _settings.width !== "auto") {
                finalHeight = (image.height / image.width) * _settings.width;
                // Use image original height
            } else if (_settings.height === "auto") {
                finalHeight = image.naturalHeight;
                // Use custom height
            } else {
                finalHeight = _settings.height;
            }

            // Define the canvas intrinsic size
            canvas.width = finalWidth;
            canvas.height = finalHeight;

            // Render image in the canvas
            context.drawImage(image, 0, 0, finalWidth, finalHeight);

            if (outputFormat === "blob") {
                // Fullfil and Return the Blob image
                canvas.toBlob(function (blob) {
                    resolve(blob as any);
                }, _settings.mimetype, _settings.quality);
            } else if (outputFormat === "img") {
                resolve(CanvasToImage(canvas) as any)
            } else {
                // Fullfil and Return the Base64 image
                resolve(canvas.toDataURL(_settings.mimetype, _settings.quality) as any);
            }
        };

        // Load the SVG in Base64 to the image
        image.src = svgBase64;
    });
}