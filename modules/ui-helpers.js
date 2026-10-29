import { 
  deleteWidget, 
  setStatusBarVisible, 
  widget,
} from "@zos/ui";
import { px } from "@zos/utils";
import { getDeviceInfo, 
  SCREEN_SHAPE_SQUARE,
} from "@zos/device"; 
import { setPageBrightTime } from "@zos/display";

const deviceInfo = getDeviceInfo();

export const isSquareScreen =
  deviceInfo.screenShape === SCREEN_SHAPE_SQUARE;
export const SCREEN_WIDTH = deviceInfo.width;

/** Apply shared page settings for square displays. And 1 minute display on */
export function configurePage() {
  setPageBrightTime({ brightTime: 60000 });

  if (isSquareScreen) {
    setStatusBarVisible(false);
  }
}

/** QR Code dimensions based on screen shape */
export function getQrCodeLayout() {
  return {
    x: px(115),
    y: px(isSquareScreen ? 220 : 190),
    w: px(250),
    h: px(250),
    bg_x: px(95),
    bg_y: px(isSquareScreen ? 200 : 170),
    bg_w: px(290),
    bg_h: px(290),
  };
}

/** Return centered absolute coordinates for a percentage of the screen width. */
export function getCenteredLayout(widthRatio = 0.84) {
  const width = SCREEN_WIDTH * widthRatio;
  return {
    x: px((SCREEN_WIDTH - width) / 2),
    w: px(width),
  };
}

/** Delete a widget and all of its descendants, including nested containers. */
export function removeElement(element) {
  if (!element) return;

  if (element.getType() === widget.VIRTUAL_CONTAINER) {
    const children = [...element.layoutChildren];
    deleteWidget(element);
    children.forEach(removeElement);
    return;
  }

  deleteWidget(element);
}