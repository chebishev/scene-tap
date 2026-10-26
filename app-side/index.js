
import { BaseSideService } from "@zeppos/zml/base-side";
import { API_KEY, API_URL } from "../modules/api-config";

async function requestApi(path, method = "GET", body = undefined) {
  const response = await fetch({
    url: `${API_URL}${path}`,
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const resBody =
    typeof response.body === "string"
      ? JSON.parse(response.body)
      : response.body;

  return {
    status: response.status,
    data: resBody,
  };
}

async function fetchData(res, path, method = "GET", body = undefined) {
  try {
    const result = await requestApi(path, method, body);
    res(null, { result });
  } catch (error) {
    console.log("API request error:", error);

    res(null, {
      result: {
        error: String(error),
      },
    });
  }
}

AppSideService(
  BaseSideService({
    onInit() { },

    onRequest(req, res) {
      console.log("=====>", req.method);

      if (req.method === "START_QR_LOGIN") {
        fetchData(res, "/login/qr", "POST");
        return;
      }

      if (req.method === "GET_LOGIN_STATUS") {
        fetchData(res, "/login/status");
        return;
      }

      if (req.method === "GET_DATA" || req.method === "GET_DEVICES") {
        fetchData(res, "/devices");
        return;
      }

      if (req.method === "GET_SCENES") {
        fetchData(res, "/scenes");
        return;
      }

      if (req.method === "RUN_SCENE") {
        const sceneId = req.params?.scene_id;

        if (sceneId == null || sceneId === "") {
          res(null, {
            result: { error: "Missing scene_id" },
          });
          return;
        }

        fetchData(
          res,
          `/scenes/${encodeURIComponent(sceneId)}/run`,
          "POST"
        );
        return;
      }

      if (req.method === "SET_DEVICE_STATE") {
        const did = req.params?.did;
        const state = req.params?.state;

        if (did == null || typeof state !== "boolean") {
          res(null, {
            result: {
              error: "Missing did or invalid state",
            },
          });
          return;
        }

        fetchData(
          res,
          `/devices/${encodeURIComponent(did)}/state`,
          "POST",
          { state }
        );
        return;
      }

      res(null, {
        result: {
          error: `Unknown method: ${req.method}`,
        },
      });
    },

    onRun() { },

    onDestroy() { },
  })
);