A [redux middleware](http://redux.js.org/docs/advanced/Middleware.html) to use [@vkammerer/postmessage-raf](https://github.com/vkammerer/postmessage-raf).

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

## Usage
An action will be passed to another thread store if the meta attribute ```toWorker``` or ```toMain``` is set to true.   

In the main thread:
```javascript
dispatch({
  type: 'UI_ACTION',
  meta: {
    toWorker: true
  }
});
// This action will be passed to the worker store and ignored by the main store.
```   
In the worker:
```javascript
dispatch({
  type: 'WORKER_ACTION',
  meta: {
    toMain: true
  }
});
// This action will be passed to the main thread store and ignored by the worker store.
```
A delay can be set to a worker action with additional meta attributes:  
```javascript
dispatch({
  type: 'DELAYED_WORKER_ACTION',
  meta: {
    toMain: true,
    delay: {
      count: 10, // Not to be used in conjunction with 'index'
      index: 12 // Not to be used in conjunction with 'count'
    }
  }
});
// This action will be dispatched to the main thread store
// - after the 10th ping since the start,
// - or 12 pings after it receives the message.
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
In ping mode, 4 actions are triggered after each ping.
On the main thread store, the two actions are:
```javascript
{
  type: 'PING_BEFORE',
  payload: {
    count: 10 // number of pings since Ping mode is started
  }
}
{
  type: 'PING_AFTER',
  payload: {
    count: 10 // number of pings since Ping mode is started
  }
}
// This action will be dispatched to the worker store.
```   
