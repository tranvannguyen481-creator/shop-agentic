import { ImgHTMLAttributes } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

interface ZoomImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  zoomSrc?: string;
}

function ZoomImage({ zoomSrc, ...imgProps }: ZoomImageProps) {
  return (
    <Zoom zoomImg={zoomSrc ? { src: zoomSrc } : undefined}>
      <img {...imgProps} />
    </Zoom>
  );
}

export default ZoomImage;
