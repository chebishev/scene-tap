
import {
    createWidget,
    widget,
    align,
    text_style,
    setStatusBarVisible,
} from "@zos/ui";
import { px } from "@zos/utils";
import { getDeviceInfo, SCREEN_SHAPE_SQUARE } from "@zos/device";
import { log as Logger } from "@zos/utils";
import { BasePage } from "@zeppos/zml/base-page";

const { screenShape, width: WIDTH } = getDeviceInfo();
const logger = Logger.getLogger("login");

Page(
    BasePage({
        state: {
            qrContent: null,
            status: "Starting login...",
            vc: null,
        },

        onInit() {
            if (screenShape === SCREEN_SHAPE_SQUARE) {
                setStatusBarVisible(false);
            }
        },

        build() {
            this.startLogin();
        },

        createText(parent, text, height, fontSize) {
            return createWidget(widget.TEXT, {
                parent,
                text,
                color: 0xffffff,
                align_v: align.CENTER_V,
                align_h: align.CENTER_H,
                text_style: text_style.CHAR_WRAP,
                layout: {
                    width: "100%",
                    height,
                    font_size: fontSize,
                },
            });
        },



        render() {
            const margin = px(WIDTH * 0.08);
            const contentWidth = px(WIDTH * 0.84);
            const centerX = px(WIDTH / 2);

            createWidget(widget.TEXT, {
                x: margin,
                y: px(30),
                w: contentWidth,
                h: px(45),
                text: "Xiaomi Login",
                color: 0xffffff,
                text_size: px(28),
                align_h: align.CENTER_H,
                align_v: align.CENTER_V,
            });

            if (this.state.status === "waiting_for_scan" && this.state.qrContent) {
                const qrSize = px(WIDTH * 0.58);
                const qrX = centerX - qrSize / 2;
                const qrY = px(90);
                const bgSize = px(WIDTH * 0.625);

                createWidget(widget.QRCODE, {
                    content: this.state.qrContent,
                    x: qrX,
                    y: qrY,
                    w: qrSize,
                    h: qrSize,
                    bg_x: centerX - bgSize / 2,
                    bg_y: qrY - px(10),
                    bg_w: bgSize,
                    bg_h: bgSize,
                });

                createWidget(widget.TEXT, {
                    x: margin,
                    y: qrY + qrSize + px(20),
                    w: contentWidth,
                    h: px(40),
                    text: "Scan with QR Scanner",
                    color: 0xffffff,
                    text_size: px(20),
                    align_h: align.CENTER_H,
                    align_v: align.CENTER_V,
                });
            } else {
                createWidget(widget.TEXT, {
                    x: margin,
                    y: px(180),
                    w: contentWidth,
                    h: px(80),
                    text: this.state.status,
                    color: 0xffffff,
                    text_size: px(24),
                    align_h: align.CENTER_H,
                    align_v: align.CENTER_V,
                });
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
