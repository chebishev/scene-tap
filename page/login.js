
import {
  createWidget,
  widget,
} from "@zos/ui";
import { px, log as Logger } from "@zos/utils";
import {
  configurePage,
  removeElement,
  SCREEN_WIDTH,
  getQrCodeLayout,
} from "../modules/ui-helpers";
import {
  createPageContainer,
  createPageText,
  finishPageLayout,
} from "../modules/page-layout";
import { BasePage } from "@zeppos/zml/base-page";
import { vibrateError } from "../modules/feedback";

const logger = Logger.getLogger("login");

Page(
  BasePage({
    state: {
      qrContent: null,
      status: "Starting login...",
      vc: null,
      qrWidget: null,
    },

    onInit() {
      configurePage();
    },

    build() {
      this.startLogin();
    },

    clearPage() {
      if (this.state.vc) {
        removeElement(this.state.vc);
        this.state.vc = null;
      }

      if (this.state.qrWidget) {
        removeElement(this.state.qrWidget);
        this.state.qrWidget = null;
      }
    },

    render() {
      this.clearPage();

      const vc = createPageContainer();
      this.state.vc = vc;

      createPageText(vc, "Xiaomi Login", "auto", px(40));

      if (this.state.status === "waiting_for_scan" && this.state.qrContent) {

        this.state.qrWidget = createWidget(widget.QRCODE, {
          content: this.state.qrContent,
          ...getQrCodeLayout(),
        });

        createPageText(
          vc,
          "Scan with QR Scanner",
          "auto",
          px(24)
        );
      } else {
        createPageText(
          vc,
          this.state.status,
          "auto",
          px(24)
        );
      }

      finishPageLayout(vc);
    },

    startLogin() {
      this.request({
        method: "START_QR_LOGIN",
      })
        .then((response) => {
          const { result = {} } = response;
          const data = result.data;

          if (result.error) {
            throw new Error(result.error);
          }

          if (!data || !data.status) {
            throw new Error("Invalid login response");
          }

          if (data.status === "authenticated") {
            this.state.status = "Already authenticated";
            this.render();
            return;
          }

          if (data.status !== "waiting_for_scan" || !data.content) {
            throw new Error("QR login was not started");
          }

          this.state.qrContent = data.content;
          this.state.status = "waiting_for_scan";
          this.render();
          this.checkLoginStatus();
        })
        .catch((error) => {
          logger.log(`START_QR_LOGIN error: ${String(error)}`);
          vibrateError();

          this.state.status = "Failed to start login";
          this.render();
        });
    },

    checkLoginStatus() {
      this.request({
        method: "GET_LOGIN_STATUS",
      })
        .then((response) => {
          const { result = {} } = response;
          const data = result.data;

          if (data?.status === "authenticated") {
            this.state.status = "Login successful";
            this.state.qrContent = null;
            logger.log("Xiaomi login successful");
            this.render();
            return;
          }

          if (data?.status === "failed") {
            this.state.status = "Login failed";
            this.state.qrContent = null;
            this.render();
          }

          // Polling will be added after we verify the QR rendering.
        })
        .catch((error) => {
          logger.log(`GET_LOGIN_STATUS error: ${String(error)}`);
          vibrateError();
        });
    },
  })
);