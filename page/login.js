
import {
    createWidget,
    widget,
    align,
} from "@zos/ui";
import { px } from "@zos/utils";
import { configurePage, getCenteredLayout, removeElement, SCREEN_WIDTH } from "../modules/ui-helpers";
import { log as Logger } from "@zos/utils";
import { BasePage } from "@zeppos/zml/base-page";

const logger = Logger.getLogger("login");

Page(
    BasePage({
        state: {
            qrContent: null,
            status: "Starting login...",
            renderedWidgets: [],
        },

        onInit() {
            configurePage();
        },

        build() {
            this.startLogin();
        },

        clearRenderedWidgets() {
            this.state.renderedWidgets.forEach(removeElement);
            this.state.renderedWidgets = [];
        },

        render() {
            this.clearRenderedWidgets();

            const { x: margin, w: contentWidth } = getCenteredLayout();
            const centerX = px(SCREEN_WIDTH / 2);

            this.state.renderedWidgets.push(createWidget(widget.TEXT, {
                x: margin,
                y: px(30),
                w: contentWidth,
                h: px(45),
                text: "Xiaomi Login",
                color: 0xffffff,
                text_size: px(28),
                align_h: align.CENTER_H,
                align_v: align.CENTER_V,
            }));

            if (this.state.status === "waiting_for_scan" && this.state.qrContent) {
                const qrSize = px(SCREEN_WIDTH * 0.58);
                const qrX = centerX - qrSize / 2;
                const qrY = px(90);
                const bgSize = px(SCREEN_WIDTH * 0.625);

                this.state.renderedWidgets.push(createWidget(widget.QRCODE, {
                    content: this.state.qrContent,
                    x: qrX,
                    y: qrY,
                    w: qrSize,
                    h: qrSize,
                    bg_x: centerX - bgSize / 2,
                    bg_y: qrY - px(10),
                    bg_w: bgSize,
                    bg_h: bgSize,
                }));

                this.state.renderedWidgets.push(createWidget(widget.TEXT, {
                    x: margin,
                    y: qrY + qrSize + px(20),
                    w: contentWidth,
                    h: px(40),
                    text: "Scan with QR Scanner",
                    color: 0xffffff,
                    text_size: px(20),
                    align_h: align.CENTER_H,
                    align_v: align.CENTER_V,
                }));
            } else {
                this.state.renderedWidgets.push(createWidget(widget.TEXT, {
                    x: margin,
                    y: px(180),
                    w: contentWidth,
                    h: px(80),
                    text: this.state.status,
                    color: 0xffffff,
                    text_size: px(24),
                    align_h: align.CENTER_H,
                    align_v: align.CENTER_V,
                }));
            }
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
                        return;
                    }

                    // Polling will be added after we verify the QR rendering.
                })
                .catch((error) => {
                    logger.log(`GET_LOGIN_STATUS error: ${String(error)}`);
                });
        },
    })
);
