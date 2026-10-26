
import {
  createWidget,
  widget,
  align,
  text_style,
  setStatusBarVisible,
} from "@zos/ui";
import { px } from "@zos/utils";
import { getDeviceInfo, SCREEN_SHAPE_SQUARE } from "@zos/device";
import { push } from "@zos/router";
import { BasePage } from "@zeppos/zml/base-page";

const { screenShape } = getDeviceInfo();

const menuButtonColor = 0x00bc9c;

const defaultTextStyle = {
  color: 0xffffff,
  align_v: align.CENTER_V,
  align_h: align.CENTER_H,
  text_style: text_style.CHAR_WRAP,
};

const menuButtonLayout = {
  width: "100%",
  height: px(88),
  font_size: 36,
  corner_radius: px(44),
};

const pageLayout = {
  left: "0",
  top: "0",
  width: "100vw",
  height: "100vh",
  display: "flex",
  flex_flow: "column",
  row_gap: px(25),
  padding_top: px(40),
  padding_left: px(72),
  padding_right: px(72),
};

Page(
  BasePage({
    state: {
      vc: null,
    },

    onInit() {
      if (screenShape === SCREEN_SHAPE_SQUARE) {
        setStatusBarVisible(false);
      }
    },

    build() {
      const vc = createWidget(widget.VIRTUAL_CONTAINER, {
        layout: { ...pageLayout },
      });

      this.state.vc = vc;

      createWidget(widget.TEXT, {
        parent: vc,
        text: "Scene Tap",
        ...defaultTextStyle,
        layout: {
          width: "100%",
          height: "auto",
          font_size: px(40),
        },
      });

      this.createMenuButton(vc, "Check login", () => {
        push({ url: "page/login" });
      })

      this.createMenuButton(vc, "Devices", () => {
        push({ url: "page/devices" });
      });

      this.createMenuButton(vc, "Scenes", () => {
        push({ url: "page/scenes" });
      });
    },

    createMenuButton(parent, text, clickFunc) {
      return createWidget(widget.BUTTON, {
        parent,
        text,
        normal_color: menuButtonColor,
        press_color: 0x008B73,
        click_func: clickFunc,
        layout: { ...menuButtonLayout },
      });
    },
  })
);