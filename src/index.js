import { mainMessager, workerMessager } from "@vkammerer/postmessage-raf";
// import { mainMessager, workerMessager } from "../../postmessage-raf";
import { logWithPerf } from "./utils";

export const createMainMiddleware = (worker, options) => store => {
  const messager = mainMessager({
    worker,
    onAction: store.dispatch,
    beforePing: !options || !options.dispatchBeforePing
      ? undefined
      : count => store.dispatch({ type: "PING_BEFORE", payload: count }),
    afterPing: !options || !options.dispatchAfterPing
      ? undefined
      : count => store.dispatch({ type: "PING_AFTER", payload: count })
  });
  return next =>
    function handleActionInMiddleware(action) {
      if (action.meta && action.meta.toMain) return next(action);
      if (action.meta && action.meta.toWorker) messager.post(action);
      if (action.meta && (action.meta.delay || action.meta.ignoreSelf)) return;
      return next(action);
    };
};

export const createWorkerMiddleware = options => store => {
  const messager = workerMessager({
    onAction: store.dispatch,
    beforePong: !options || !options.dispatchBeforePong
      ? undefined
      : count => store.dispatch({ type: "PONG_BEFORE", payload: count }),
    afterPong: !options || !options.dispatchAfterPong
      ? undefined
      : count => store.dispatch({ type: "PONG_AFTER", payload: count })
  });
  return next =>
    function handleActionInMiddleware(action) {
      if (action.meta && action.meta.toWorker) return next(action);
      if (action.meta && action.meta.toMain) {
        messager.post(action, { delay: action.meta.delay });
        if (action.type === "PING_START") messager.startPing();
        if (action.type === "PING_STOP") messager.stopPing();
      }
      if (action.meta && (action.meta.delay || action.meta.ignoreSelf)) return;
      return next(action);
    };
};
