import {
  createWidget,
  widget,
  align,
  text_style,
  updateLayout,
} from "@zos/ui";
import { px, log as Logger } from "@zos/utils";
import { configurePage, removeElement } from "../modules/ui-helpers";
import { BasePage } from "@zeppos/zml/base-page";
import { vibrateError } from "../modules/feedback";

const logger = Logger.getLogger("devices");

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
      configurePage();
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
        removeElement(this.state.vc);
        this.state.vc = null;
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
      this.state.message = "Loading devices...";
      this.state.devices = [];
      this.renderDevices();

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

          vibrateError();

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
          return this.loadDevices();
        })
        .catch((error) => {
          logger.log(`SET_DEVICE_STATE error: ${String(error)}`);

          vibrateError();

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