import {
  createWidget,
  widget,
  align,
  text_style,
  updateLayout,
} from "@zos/ui";
import { px } from "@zos/utils";
import { configurePage, getCenteredLayout, removeElement } from "../modules/ui-helpers";
import { log as Logger } from "@zos/utils";
import { BasePage } from "@zeppos/zml/base-page";

const logger = Logger.getLogger("scenes");

const menuButtonColor = 0x45643B;

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
      scenes: [],
      vc: null,
      message: null,
      messageWidgets: [],
    },

    onInit() {
      configurePage();
    },

    build() {
      this.loadScenes();
    },

    onPause() { },

    onResume() {
      this.clearPage();
      this.loadScenes();
    },

    clearPage() {
      if (this.state.vc) {
        removeElement(this.state.vc);
        this.state.vc = null;
      }

      this.state.messageWidgets.forEach(removeElement);
      this.state.messageWidgets = [];
    },

    createPageContainer() {
      const vc = createWidget(widget.VIRTUAL_CONTAINER, {
        layout: { ...pageLayout },
      });

      this.state.vc = vc;
      return vc;
    },

    createText(parent, text, height, fontSize) {
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
    },

    createSceneButton(parent, scene) {
      return createWidget(widget.BUTTON, {
        parent,
        text: scene.name,
        normal_color: menuButtonColor,
        press_color: 0x374F2F,
        click_func: () => this.runScene(scene),
        layout: { ...menuButtonLayout },
      });
    },

    loadScenes() {
      this.state.message = "Loading scenes...";
      this.renderScenes();

      this.request({
        method: "GET_SCENES",
      })
        .then((response) => {
          const { result = {} } = response;

          if (result.error) {
            throw new Error(result.error);
          }

          const scenes = result.data?.items;

          if (!Array.isArray(scenes)) {
            throw new Error("Invalid scenes response");
          }

          this.state.scenes = scenes;
          this.state.message = null;
          this.renderScenes();
        })
        .catch((error) => {
          logger.log(`GET_SCENES error: ${String(error)}`);
          this.state.scenes = [];
          this.state.message = "Failed to load scenes";
          this.renderScenes();
        });
    },



    renderScenes() {
      this.clearPage();

      if (this.state.message || this.state.scenes.length === 0) {
        const { x, w } = getCenteredLayout();

        this.state.messageWidgets.push(createWidget(widget.TEXT, {
          x,
          y: px(35),
          w,
          h: px(55),
          text: "Available Scenes",
          color: 0xffffff,
          text_size: px(30),
          align_h: align.CENTER_H,
          align_v: align.CENTER_V,
        }));

        this.state.messageWidgets.push(createWidget(widget.TEXT, {
          x,
          y: px(130),
          w,
          h: px(70),
          text: this.state.message || "No scenes found",
          color: 0xffffff,
          text_size: px(22),
          align_h: align.CENTER_H,
          align_v: align.CENTER_V,
        }));

        return;
      }

      // Оригиналният интерфейс с бутоните остава непроменен.
      const vc = this.createPageContainer();

      this.createText(
        vc,
        "Available Scenes",
        "auto",
        px(40)
      );

      for (const scene of this.state.scenes) {
        this.createSceneButton(vc, scene);
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



    runScene(scene) {
      logger.log(`Running scene: ${scene.name}`);

      this.request({
        method: "RUN_SCENE",
        params: {
          scene_id: scene.scene_id,
        },
      })
        .then((response) => {
          const { result = {} } = response;

          if (result.error || result.status >= 400) {
            throw new Error(
              result.error || `HTTP ${result.status}`
            );
          }

          logger.log(
            `Scene command response: ${JSON.stringify(result)}`
          );
        })
        .catch((error) => {
          logger.log(`RUN_SCENE error: ${String(error)}`);
        });
    },
  })
);