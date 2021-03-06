import * as React from "react";
import { TaggedImage } from "farmbot";
import { CameraCalibrationData, BotOriginQuadrant } from "../../../interfaces";
import { MapTransformProps } from "../../interfaces";
import { transformXY } from "../../util";
import { isNumber, round, last } from "lodash";
import { equals } from "../../../../util";
import { Color } from "../../../../ui";

const PRECISION = 3; // Number of decimals for image placement coordinates
/** Show all images roughly on map when no calibration values are present. */
const PRE_CALIBRATION_PREVIEW = true;

/* Parse floats in camera calibration environment variables. */
const parse = (str: string | undefined) => {
  const parsed = str ? parseFloat(str) : NaN;
  return !isNaN(parsed) ? parsed : undefined;
};

/* Check if the image has been rotated according to the calibration value. */
export const isRotated = (annotation: string | undefined, noCalib: boolean) => {
  if (PRE_CALIBRATION_PREVIEW && noCalib) { return true; }
  return annotation &&
    (annotation.includes("rotated")
      || annotation.includes("marked")
      || annotation.includes("calibration_result"));
};

/* Check if the calibration data is valid for the image provided using z. */
export const cameraZCheck =
  (imageZ: number | undefined, calibZ: string | undefined) => {
    if (PRE_CALIBRATION_PREVIEW && !calibZ) { return true; }
    const calibrationZ = parse(calibZ);
    return isNumber(imageZ) && isNumber(calibrationZ) &&
      Math.abs(imageZ - calibrationZ) < 5;
  };

/* Check if the calibration image center matches the provided image. */
export const cameraOrientationCheck =
  (size: Record<"width" | "height", number>,
    calibCenter: Record<"x" | "y", string | undefined>,
    alreadyRotated: boolean,
  ) => {
    if (!alreadyRotated) { return true; }
    if (PRE_CALIBRATION_PREVIEW && !calibCenter.x) { return true; }
    const calibrationCenter = {
      x: parse(calibCenter.x),
      y: parse(calibCenter.y),
    };
    return isNumber(calibrationCenter.x) && isNumber(calibrationCenter.y)
      && Math.abs(size.width / 2 - calibrationCenter.x) < 5
      && Math.abs(size.height / 2 - calibrationCenter.y) < 5;
  };

/* Get the size of the image at the URL. */
const getImageSize = (
  url: string,
  onLoad: (img: HTMLImageElement) => () => void,
): void => {
  const imageData = new Image();
  imageData.src = url;
  imageData.onload = onLoad(imageData);
};

/* Flip (mirror) image based on orientation of camera. */
const originAdjustment = (imageOrigin: string) => {
  switch (imageOrigin) {
    case "BOTTOM_RIGHT":
      return { x: -1, y: -1 };
    case "BOTTOM_LEFT":
      return { x: 1, y: -1 };
    case "TOP_RIGHT":
      return { x: -1, y: 1 };
    case "TOP_LEFT":
    default:
      return { x: 1, y: 1 };
  }
};

/* Flip (mirror) image based on map quadrant. */
const quadrantAdjustment = (quadrant: BotOriginQuadrant) => {
  switch (quadrant) {
    case 1:
      return { x: -1, y: 1 };
    case 3:
      return { x: 1, y: -1 };
    case 4:
      return { x: -1, y: -1 };
    case 2:
    default:
      return { x: 1, y: 1 };
  }
};

/** Determine additional scale flip required when map is rotated. */
const xySwapFlip = (imageOrigin: string) => {
  switch (imageOrigin) {
    case "BOTTOM_RIGHT":
      return { x: -1, y: 1 };
    case "BOTTOM_LEFT":
      return { x: 1, y: -1 };
    case "TOP_RIGHT":
      return { x: 1, y: -1 };
    case "TOP_LEFT":
    default:
      return { x: -1, y: 1 };
  }
};

const rotateOrigin = (imageOrigin: string) => {
  switch (imageOrigin) {
    case "BOTTOM_RIGHT":
      return "TOP_LEFT";
    case "BOTTOM_LEFT":
      return "TOP_RIGHT";
    case "TOP_RIGHT":
      return "BOTTOM_LEFT";
    case "TOP_LEFT":
    default:
      return "BOTTOM_RIGHT";
  }
};

interface TransformProps {
  quadrant: BotOriginQuadrant;
  qCoords: { qx: number, qy: number };
  size: { x: number, y: number };
  imageOrigin: string;
  xySwap: boolean;
  rotate: number;
  noRotation?: boolean;
  rotated90?: boolean;
}

/* Image transform string. Flip and place image at the correct map location. */
const generateTransform = (props: TransformProps): string => {
  const {
    quadrant, qCoords, size, imageOrigin, xySwap, rotate,
  } = props;
  const { qx, qy } = qCoords;
  const originAdjust = originAdjustment(imageOrigin);
  const quadrantAdjust = quadrantAdjustment(quadrant);
  const flip = {
    x: originAdjust.x * quadrantAdjust.x,
    y: originAdjust.y * quadrantAdjust.y,
  };
  const toZero = {
    x: quadrantAdjust.x < 0 ? originAdjust.x * size.x : 0,
    y: quadrantAdjust.y < 0 ? originAdjust.y * size.y : 0,
  };
  const translate = {
    x: round(flip.x * qx + toZero.x, PRECISION),
    y: round(flip.y * qy + toZero.y, PRECISION),
  };
  const swapFlip = xySwapFlip(imageOrigin);
  const swapTranslationAmount = round(Math.abs(size.x - size.y) / 2, PRECISION);
  const swapRotateAdjust = props.rotated90 ? -1 : 1;
  const swapTranslate = {
    x: originAdjust.y * swapTranslationAmount * swapRotateAdjust,
    y: originAdjust.x * swapTranslationAmount * swapRotateAdjust,
  };
  return `scale(${flip.x}, ${flip.y})`
    + ` translate(${translate.x}, ${translate.y})`
    + (xySwap ? ` scale(${swapFlip.x}, ${swapFlip.y})` : "")
    + (xySwap ? ` translate(${swapTranslate.x}, ${swapTranslate.y})` : "")
    + ` rotate(${(xySwap && !props.noRotation ? 90 : 0) - rotate})`;
};

interface ParsedCalibrationData {
  noCalib: boolean;
  imageScale: number | undefined;
  imageOffsetX: number | undefined;
  imageOffsetY: number | undefined;
  imageOrigin: string | undefined;
  imageRotation: number | undefined;
}

/** If calibration data exists, parse it, usually to a number.
 * Otherwise, return values for pre-calibration preview. */
const parseCalibrationData =
  (props: CameraCalibrationData): ParsedCalibrationData => {
    const { scale, offset, origin, rotation } = props;
    const noCalib = PRE_CALIBRATION_PREVIEW && !parse(scale);
    const imageScale = noCalib ? 0.6 : parse(scale);
    const imageOffsetX = noCalib ? 0 : parse(offset.x);
    const imageOffsetY = noCalib ? 0 : parse(offset.y);
    const cleanOrigin = origin ? origin.split("\"").join("") : undefined;
    const imageOrigin = noCalib ? "TOP_LEFT" : cleanOrigin;
    const imageRotation = noCalib ? 0 : parse(rotation);
    return {
      noCalib, imageScale, imageOffsetX, imageOffsetY, imageOrigin,
      imageRotation,
    };
  };

export interface MapImageProps {
  image: TaggedImage | undefined;
  hoveredMapImage: number | undefined;
  cameraCalibrationData: CameraCalibrationData;
  cropImage: boolean;
  mapTransformProps: MapTransformProps;
}

interface MapImageState {
  imageWidth: number;
  imageHeight: number;
}

/*
 * Place the camera image in the Farm Designer map.
 * Assume the image that is provided from the Farmware is rotated correctly.
 * Require camera calibration data to display the image.
 */
export class MapImage extends React.Component<MapImageProps, MapImageState> {
  state: MapImageState = { imageWidth: 0, imageHeight: 0 };

  shouldComponentUpdate(nextProps: MapImageProps, nextState: MapImageState) {
    const propsChanged = !equals(this.props, nextProps);
    const stateChanged = !equals(this.state, nextState);
    return propsChanged || stateChanged;
  }

  imageCallback = (img: HTMLImageElement) => () => {
    const { width, height } = img;
    this.setState({ imageWidth: width, imageHeight: height });
  };

  render() {
    const { image, cameraCalibrationData, mapTransformProps, cropImage,
    } = this.props;
    const { noCalib, imageScale, imageRotation } =
      parseCalibrationData(cameraCalibrationData);
    const { calibrationZ, center } = cameraCalibrationData;

    /* Check if the image exists. */
    if (image && !image.body.attachment_url.includes("placehold")) {
      const imageUrl = image.body.attachment_url;
      const { x, y, z } = image.body.meta;
      const imageMetaName = image.body.meta.name || "";
      const imageUploadName = last(imageMetaName.split("/"));
      getImageSize(imageUrl, this.imageCallback);
      const { imageWidth, imageHeight } = this.state;
      const alreadyRotated = !!isRotated(imageMetaName, noCalib);

      /* Check for necessary camera calibration and image data. */
      if (imageScale && cameraZCheck(z, calibrationZ) && cameraOrientationCheck(
        { width: imageWidth, height: imageHeight }, center, alreadyRotated)) {
        const imagePosition = mapImagePositionData({
          x, y, width: imageWidth, height: imageHeight,
          cameraCalibrationData, mapTransformProps, alreadyRotated,
        });
        if (imagePosition) {
          const { width, height, transform, transformOrigin } = imagePosition;
          const hovered = this.props.hoveredMapImage == image.body.id;
          const clipName = cropPathName(cropImage, imageRotation, image.body.id);
          return <g id={`image-${image.body.id}`}>
            {clipName != "none" &&
              <CropClipPaths imageId={image.body.id}
                width={width} height={height}
                transformOrigin={transformOrigin}
                rotation={imageRotation} alreadyRotated={alreadyRotated} />}
            {hovered &&
              <rect id={"highlight-border"}
                x={0} y={0} height={height} width={width}
                stroke={Color.orange} strokeWidth={10}
                fill={Color.black} fillOpacity={0.75}
                transform={transform}
                style={{ transformOrigin }} />}
            <image
              data-comment={`${imageUploadName}: ${imagePosition.comment}`}
              xlinkHref={imageUrl}
              x={0} y={0}
              height={height} width={width}
              transform={transform}
              style={{ transformOrigin }}
              opacity={!this.props.hoveredMapImage || hovered ? 1 : 0.3}
              clipPath={clipName} />
          </g>;
        }
      }
    }
    return <image />;
  }
}

export interface MapImagePositionDataProps {
  x: number | undefined;
  y: number | undefined;
  width: number;
  height: number;
  cameraCalibrationData: CameraCalibrationData;
  mapTransformProps: MapTransformProps;
  alreadyRotated: boolean;
  noRotation?: boolean;
}

export interface MapImagePositionData {
  height: number;
  width: number;
  transform: string;
  transformOrigin: string;
  comment: string;
}

interface VerifyDataProps {
  x: number | undefined;
  y: number | undefined;
  width: number;
  height: number;
  imageScale: number | undefined;
  imageOffsetX: number | undefined;
  imageOffsetY: number | undefined;
  imageOrigin: string | undefined;
}

interface VerifiedData {
  x: number;
  y: number;
  width: number;
  height: number;
  imageScale: number;
  imageOffsetX: number;
  imageOffsetY: number;
  imageOrigin: string;
}

/* Verify camera calibration and image data meets requirements. */
const verifyData = (props: VerifyDataProps): VerifiedData | undefined => {
  const {
    x, y, width, height, imageScale, imageOffsetX, imageOffsetY, imageOrigin,
  } = props;
  if (isNumber(x) && isNumber(y) && height > 0 && width > 0 &&
    isNumber(imageScale) && imageScale > 0 &&
    isNumber(imageOffsetX) && isNumber(imageOffsetY) && imageOrigin) {
    return {
      x, y, width, height, imageScale, imageOffsetX, imageOffsetY, imageOrigin
    };
  }
};

export const mapImagePositionData = (props: MapImagePositionDataProps):
  MapImagePositionData | undefined => {
  const { cameraCalibrationData, alreadyRotated, noRotation } = props;
  const imageRotated = alreadyRotated && !noRotation;
  const parsed = parseCalibrationData(cameraCalibrationData);
  const rotated90 = rotated90degrees(parsed.imageRotation);
  const verifiedData = verifyData({
    x: props.x, y: props.y, width: props.width, height: props.height,
    imageScale: parsed.imageScale, imageOrigin: parsed.imageOrigin,
    imageOffsetX: parsed.imageOffsetX, imageOffsetY: parsed.imageOffsetY,
  });
  if (verifiedData) {
    const {
      x, y, width, height, imageScale, imageOffsetX, imageOffsetY, imageOrigin
    } = verifiedData;
    /* Use pixel to coordinate scale to scale image. */
    const size = {
      x: round(width * imageScale, PRECISION),
      y: round(height * imageScale, PRECISION),
    };
    const center = { x: size.x / 2, y: size.y / 2 };
    const tOrigin = {
      x: round(center.x),
      y: round(center.y),
    };
    const o = { // Coordinates of top left corner of image for placement
      x: round(x + imageOffsetX - center.x, PRECISION),
      y: round(y + imageOffsetY - center.y, PRECISION),
    };
    const qCoords = transformXY(o.x, o.y, props.mapTransformProps);
    const { quadrant, xySwap } = props.mapTransformProps;
    const rotate = alreadyRotated ? 0 : parsed.imageRotation || 0;
    const imgOrigin =
      !imageRotated && rotated90 ? rotateOrigin(imageOrigin) : imageOrigin;
    const transformProps: TransformProps = {
      quadrant, qCoords, size, rotate, xySwap, noRotation,
      imageOrigin: imgOrigin,
      rotated90: imageRotated && rotated90,
    };
    return {
      height: size.y, width: size.x,
      transform: generateTransform(transformProps),
      transformOrigin: `${tOrigin.x}px ${tOrigin.y}px`,
      comment: JSON.stringify({
        width, height,
        x: { x, offset: imageOffsetX, o: o.x, qx: qCoords.qx },
        y: { y, offset: imageOffsetY, o: o.y, qy: qCoords.qy },
        quadrant, imageOrigin: imgOrigin, xySwap,
        rotated90: { camera: rotated90, image: height > width },
      }),
    };
  }
};

export const rotated90degrees = (angle: number | undefined) =>
  (Math.abs(angle || 0) + 45) % 180 > 90;

export const closestRotation = (angle: number) => {
  const remainder = Math.abs(angle % 90);
  return remainder > 45 ? 90 - remainder : remainder;
};

export const largeCrop = (angle: number) => closestRotation(angle) > 40;

export const cropAmount = (
  angle: number | undefined,
  size: Record<"width" | "height", number>,
): number => {
  const absAngle = closestRotation(angle || 0);
  if (absAngle > 0) {
    const factor = (5.61 - 0.095 * absAngle ** 2 + 9.06 * absAngle) / 640;
    const longEdge = Math.max(size.width, size.height);
    return round(longEdge * factor);
  }
  return 0;
};

interface CropClipPathsProps {
  imageId: number | undefined;
  width: number;
  height: number;
  rotation: number | undefined;
  transformOrigin: string;
  alreadyRotated: boolean;
}

const CropClipPaths = (props: CropClipPathsProps) => {
  const {
    imageId, width, height, rotation, transformOrigin, alreadyRotated,
  } = props;
  const center = { x: round(width / 2), y: round(height / 2) };
  const narrow = Math.min(center.x, center.y);
  const crop = cropAmount(rotation, { width, height });
  const rotate = alreadyRotated ? 0 : rotation || 0;
  return <g id={"crop-clip-paths"}>
    <clipPath id={`circle-${imageId}`}>
      <circle r={narrow} cx={center.x} cy={center.y} />
    </clipPath>
    <clipPath id={`rectangle-${imageId}`}>
      <rect x={crop / 2} y={crop / 2}
        width={round(width - crop)} height={round(height - crop)}
        style={{ transformOrigin }}
        transform={`rotate(${rotate})`} />
    </clipPath>
  </g>;
};

const cropPathName = (
  cropImage: boolean,
  rotation: number | undefined,
  imageId: number | undefined,
) => {
  if (cropImage && rotation) {
    const shape = largeCrop(rotation) ? "circle" : "rectangle";
    return `url(#${shape}-${imageId})`;
  }
  return "none";
};
