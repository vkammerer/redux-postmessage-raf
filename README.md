A [redux middleware](http://redux.js.org/docs/advanced/Middleware.html) for [@vkammerer/postmessage-raf](https://github.com/vkammerer/postmessage-raf).

This library makes it possible to pass FSA actions between two Redux stores (one in the main thread and one in a worker) in a declarative way.   

It provides a "Ping mode", which optimizes the time at which messages are sent between the main and the worker threads, so that every message is exchanged at the beginning of a [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) call.   

If you want to see it in action, see [vkammerer/redux-postmessage-raf-examples](https://github.com/vkammerer/redux-postmessage-raf-examples), deployed at [vkammerer.github.io/redux-postmessage-raf-examples/](https://vkammerer.github.io/redux-postmessage-raf-examples/).   

If you want to quickly try it yourself, you main find the [boilerplate](https://github.com/vkammerer/redux-postmessage-raf-boilerplate) useful.   

## Installation
```shell
npm i @vkammerer/redux-postmessage-raf
```   

## Initialization
In the main thread:
```javascript
import { createStore, applyMiddleware } from "redux";
import { createMainMiddleware } from "@vkammerer/redux-postmessage-raf";

export const slaveWorker = new Worker("./slave.js");
const mainMiddleware = createMainMiddleware({ worker: slaveWorker });

const store = createStore(reducer, applyMiddleware(mainMiddleware));
```

In "slave.js", the worker:
```javascript
import { createStore, applyMiddleware } from "redux";
import { createWorkerMiddleware } from "@vkammerer/redux-postmessage-raf";

const workerMiddleware = createWorkerMiddleware();

const store = createStore(reducer, applyMiddleware(workerMiddleware));
```

## Basic usage
An action will be passed to another thread store if the meta attribute ```toWorker``` or ```toMain``` is set to true.   

In the main thread:
```javascript
dispatch({
  type: 'UI_ACTION',
  meta: {
    toWorker: true
  }
});
// This action will be passed to the worker store.
```   
In the worker:
```javascript
dispatch({
  type: 'WORKER_ACTION',
  meta: {
    toMain: true
  }
});
// This action will be passed to the main thread store.
```   

## Ping mode
The [Ping mode](https://github.com/vkammerer/postmessage-raf#ping-mode-) can be started with the following action:   
In the worker:
```javascript
dispatch({
  type: 'PING_START',
  meta: {
    toMain: true
  }
});
// This action will start the ping mode.
```
And it can be stopped with the following action:   
In the worker:
```javascript
dispatch({
  type: 'PING_STOP',
  meta: {
    toMain: true
  }
});
// This action will stop the ping mode.
```   

## API

### Ping mode actions
The main and worker middlewares can opt in, at initialization time, to dispatch actions for any hook in the message exchange lifecycle: ```beforePing```, ```afterPing```, ```beforePong``` and ```afterPong```.
For example, in the worker:
```javascript
const workerMiddleware = createWorkerMiddleware({
  dispatchAfterPong: true,
  /*
    After each pong message is sent, an action with the following format will be dispatched:
    {
      type: "PONG_AFTER",
      payload: 10 // number of pongs since 'PING_START' was dispatched
    }
  */
});
```

### Delayed actions
In ping mode, the worker can decide to delay the action to be dispatched to the main store by setting additional meta attributes:  
In the worker:   
```javascript
dispatch({
  type: 'DELAYED_WORKER_ACTION',
  meta: {
    toMain: true,
    delay: {
      count: 10,
      /*
        Registers the action to be dispatched in the main thread store
        at the 10th ping since 'START_PING' was dispatched.
        If the ping has already occured or if the pinging mode is stopped before,
        the action will be ignored.
        Not to be used in conjunction with 'index' here under
      */
      index: 12
      /*
        Registers the action to be dispatched 12 pings after the main thread receives it.
        If the pinging mode is stopped before, the action will be ignored.
        Not to be used in conjunction with 'count' here above
      */
    }
  }
});
```
