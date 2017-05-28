import { mainMessager, workerMessager } from "@vkammerer/postmessage-raf";
// import { mainMessager, workerMessager } from "../../postmessage-raf";
import { logWithPerf } from "./utils";

export const createMainMiddleware = ({ debug, worker }) => store => {
  const messager = mainMessager({
    worker,
    onAction: store.dispatch
  });
  return next =>
    function handleActionInMiddleware(action) {
      if (action.meta && action.meta.toWorker) {
        if (debug) logWithPerf("TO WORKER  ", action);
        return messager.post(action);
      }
      if (action.meta && action.meta.toMain) {
        if (debug) logWithPerf("FROM WORKER", action);
        return next(action);
      }
      if (debug) logWithPerf("SELF MAIN  ", action);
      return next(action);
    };
};

export const createWorkerMiddleware = ({ debug }) => store => {
  const messager = workerMessager({
    onAction: store.dispatch,
    onPong: pingCount => store.dispatch({ type: "PONG", payload: pingCount })
  });
  return next =>
    function handleActionInMiddleware(action) {
      if (action.meta && action.meta.toMain) {
        if (debug) logWithPerf("TO MAIN    ", action);
        messager.post(action, { delay: action.meta.delay });
        if (action.type === "PING_START") messager.startPing();
        if (action.type === "PING_STOP") messager.stopPing();
        return;
      }
      if (action.meta && action.meta.toWorker) {
        if (debug) logWithPerf("FROM MAIN  ", action);
        return next(action);
      }
      if (debug) logWithPerf("SELF WORKER", action);
      return next(action);
    };
};
