# ExLlamav2 WebSocket API for JS
Very simple WebSocket API client written in JavaScript for connecting to [ExLlamav2 WebSocket server](https://github.com/turboderp/exllamav2/blob/master/exllamav2/server/websocket.py). Handles `streaming` and `non-streaming` requests.

## Streaming Example

```javascript
const { ExLlamaV2Api } = require("../exl2-api.js");

(async () => {
  const api = new ExLlamaV2Api({
    host: "127.0.0.1",
    port: 5001,
  });
  try {
    await api.connect();
    const data = await api.infer({
      text: "My name is",
      maxNewTokens: 50,
      stream: true,
      temperature: 1.0,
    });
    for await (const chunk of data) {
      console.log(chunk);
    }
  } catch (e) {
    console.error("Failed connecting to API server!");
    return;
  }
})();
```

## Non-Streaming Example

```javascript
const { ExLlamaV2Api } = require("../exl2-api.js");

(async () => {
  const api = new ExLlamaV2Api({
    host: "127.0.0.1",
    port: 5001,
  });
  try {
    await api.connect();
    const data = await api.infer({
      text: "My name is",
      maxNewTokens: 50,
      stream: false,
      temperature: 1.0,
    });
    console.log(data);
  } catch (e) {
    console.error("Failed connecting to API server!");
    return;
  }
})();
```