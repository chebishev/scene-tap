
import {
  createWidget,
  widget,
  align,
  text_style,
  deleteWidget,
  updateLayout,
  setStatusBarVisible,
} from "@zos/ui";
import { px, log as Logger } from "@zos/utils";
import { getDeviceInfo, SCREEN_SHAPE_SQUARE } from "@zos/device";
import { BasePage } from "@zeppos/zml/base-page";

const { screenShape } = getDeviceInfo();
const logger = Logger.getLogger("devices");

const PRIMARY_COLOR = 0x00BC9C;

const pageLayout = {
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

const textStyle = {
  color: 0xffffff,
  align_v: align.CENTER_V,
  text_style: text_style.CHAR_WRAP,
};

Page(
  BasePage({
    state: {
      devices: [],
      vc: null,
      message: null,
    },

    onInit() {
      if (screenShape === SCREEN_SHAPE_SQUARE) {
        setStatusBarVisible(false);
      }
    },

    build() {
      this.loadDevices();
    },

    onResume() {
      this.clearPage();
      this.loadDevices();
    },

    clearPage() {
      if (this.state.vc) {
        const vc = this.state.vc;
        const children = vc.layoutChildren;

        deleteWidget(vc);
        children.forEach((item) => this.removeElement(item));

        this.state.vc = null;
      }
    },

    removeElement(element) {
      if (element.getType() === widget.VIRTUAL_CONTAINER) {
        const children = element.layoutChildren;
        deleteWidget(element);
        children.forEach((item) => this.removeElement(item));
      } else {
        deleteWidget(element);
      }
    },

    createPageContainer() {
      const vc = createWidget(widget.VIRTUAL_CONTAINER, {
        layout: { ...pageLayout },
      });

      this.state.vc = vc;
      return vc;
    },

    createText(parent, text, height, fontSize, alignH) {
      return createWidget(widget.TEXT, {
        parent,
        text,
        ...textStyle,
        align_h: alignH ?? align.LEFT,
        layout: {
          width: "100%",
          height,
          font_size: fontSize,
        },
      });
    },

    loadDevices() {
      this.request({
        method: "GET_DEVICES",
      })
        .then((response) => {
          const { result = {} } = response;

          if (result.error) {
            throw new Error(result.error);
          }

          const devices = result.data?.items;

          if (!Array.isArray(devices)) {
            throw new Error("Invalid devices response");
          }

          this.state.devices = devices;
          this.state.message = null;
          this.renderDevices();
        })
        .catch((error) => {
          logger.log(`GET_DEVICES error: ${String(error)}`);
          this.state.devices = [];
          this.state.message = "Failed to load devices";
          this.renderDevices();
        });
    },

    renderDevices() {
      this.clearPage();

      const vc = this.createPageContainer();

      this.createText(
        vc,
        "Devices",
        "auto",
        px(40),
        align.CENTER_H
      );

      if (this.state.message) {
        this.createText(
          vc,
          this.state.message,
          "auto",
          px(24),
          align.CENTER_H
        );
        updateLayout(vc);
        return;
      }

      if (this.state.devices.length === 0) {
        this.createText(
          vc,
          "No devices found",
          "auto",
          px(24),
          align.CENTER_H
        );
        updateLayout(vc);
        return;
      }

      for (const device of this.state.devices) {
        this.createDeviceRow(vc, device);
      }

      createWidget(widget.FILL_RECT, {
        parent: vc,
        layout: {
          width: "100%",
          height: px(100),
        },
      });

      updateLayout(vc);
    },

    createDeviceRow(parent, device) {
      const row = createWidget(widget.VIRTUAL_CONTAINER, {
        parent,
        layout: {
          width: "100%",
          height: px(88),
          display: "flex",
          flex_flow: "row",
          justify_content: "space-between",
          align_items: "center",
        },
      });

      createWidget(widget.TEXT, {
        parent: row,
        text: device.name,
        ...textStyle,
        align_h: align.LEFT,
        layout: {
          width: "72%",
          height: "100%",
          font_size: px(26),
        },
      });

      createWidget(widget.SLIDE_SWITCH, {
        parent: row,
        checked: Boolean(device.state),
        checked_change_func: (slideSwitch, checked) => {
          this.setDeviceState(device, checked, slideSwitch);
        },
        layout: {
          width: "25%",
          height: px(54),
        },
      });
    },

    setDeviceState(device, state, slideSwitch) {
      logger.log(`Setting ${device.name} to ${state}`);

      this.request({
        method: "SET_DEVICE_STATE",
        params: {
          did: device.did,
          state,
        },
      })
        .then((response) => {
          const { result = {} } = response;

          if (result.error || result.status >= 400) {
            throw new Error(
              result.error || `HTTP ${result.status}`
            );
          }

          device.state = state;

          logger.log(
            `Device command response: ${JSON.stringify(result)}`
          );
        })
        .catch((error) => {
          logger.log(`SET_DEVICE_STATE error: ${String(error)}`);

          slideSwitch.setProperty(
            0,
            Boolean(device.state)
          );

          this.showMessage(`Failed: ${device.name}`);
        });
    },

    showMessage(message) {
      logger.log(message);
    },
  })
);