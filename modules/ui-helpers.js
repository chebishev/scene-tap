import { deleteWidget, setStatusBarVisible, widget } from "@zos/ui";
import { px } from "@zos/utils";
import { getDeviceInfo, SCREEN_SHAPE_SQUARE } from "@zos/device";import { setPageBrightTime } from "@zos/display";

const deviceInfo = getDeviceInfo();

export const SCREEN_WIDTH = deviceInfo.width;

/** Apply shared page settings for square displays. And 1 minute display on */
export function configurePage() {
  setPageBrightTime({ brightTime: 60000 });

  if (deviceInfo.screenShape === SCREEN_SHAPE_SQUARE) {
    setStatusBarVisible(false);
  }
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
