import {
  createWidget,
  widget,
} from "@zos/ui";
import { px, log as Logger } from "@zos/utils";
import { configurePage, removeElement } from "../modules/ui-helpers";
import {
  createPageContainer,
  createPageText,
  finishPageLayout,
} from "../modules/page-layout";
import { BasePage } from "@zeppos/zml/base-page";
import { vibrateError } from "../modules/feedback";

const logger = Logger.getLogger("scenes");

const menuButtonColor = 0x45643B;

const menuButtonLayout = {
  width: "100%",
  height: px(88),
  font_size: 36,
  corner_radius: px(44),
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

          vibrateError();

          this.state.scenes = [];
          this.state.message = "Failed to load scenes";
          this.renderScenes();
        });
    },



    renderScenes() {
      this.clearPage();

      const vc = createPageContainer();
      this.state.vc = vc;

      createPageText(
        vc,
        "Scenes",
        "auto",
        px(40)
      );

      if (this.state.message) {
        createPageText(
          vc,
          this.state.message,
          "auto",
          px(24)
        );

        finishPageLayout(vc);
        return;
      }

      if (this.state.scenes.length === 0) {
        createPageText(
          vc,
          "No scenes found",
          "auto",
          px(24)
        );

        finishPageLayout(vc);
        return;
      }

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

      finishPageLayout(vc);
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