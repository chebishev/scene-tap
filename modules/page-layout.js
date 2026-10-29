
import {
  createWidget,
  widget,
  align,
  text_style,
  updateLayout,
} from "@zos/ui";
import { px } from "@zos/utils";

export const pageLayout = {
  left: "0",
  top: "0",
  width: "100vw",
  height: "100vh",
  display: "flex",
  flex_flow: "column",
  row_gap: px(20),
  padding_top: px(35),
  padding_left: px(30),
  padding_right: px(30),
};

export const defaultTextStyle = {
  color: 0xffffff,
  align_v: align.CENTER_V,
  align_h: align.CENTER_H,
  text_style: text_style.CHAR_WRAP,
};

export function createPageContainer() {
  return createWidget(widget.VIRTUAL_CONTAINER, {
    layout: { ...pageLayout },
  });
}

export function createPageText(parent, text, height, fontSize) {
  return createWidget(widget.TEXT, {
    parent,
    text,
    ...defaultTextStyle,
    layout: {
      width: "100%",
      height,
      font_size: fontSize,
    },
  });
}

export function finishPageLayout(container) {
  updateLayout(container);
}