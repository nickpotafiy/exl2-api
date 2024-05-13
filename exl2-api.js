const WebSocket = require("ws");

class ExLlamaV2Api {
  constructor({ host = "127.0.0.1", port = 5001 } = {}) {
    this.host = host;
    this.port = port;
    this.socket = null;
    this.messageQueue = [];
    this.responseHandlers = new Map();
    this.requestId = 0;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(`ws://${this.host}:${this.port}`);

        this.socket.onopen = () => {
          console.log(`Connected to ${this.host}:${this.port}`);
          resolve(); // Resolve the promise when connection is established
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.socket.onclose = () => {
          console.log(`Socket connection closed to ${this.host}:${this.port}`);
        };

        this.socket.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error); // Reject the promise on error
        };
      } catch (error) {
        console.error("Failed connecting to API server:", error);
        reject(error); // Reject the promise if there is an exception
      }
    });
  }

  close() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }

  handleMessage(data) {
    try {
      const rawMessage = data;
      const message = JSON.parse(data);
      const { request_id } = message;

      if (this.responseHandlers.has(request_id)) {
        const { resolve, reject, streaming } =
          this.responseHandlers.get(request_id);

        if (message.error) {
          reject(message.error);
          this.responseHandlers.delete(request_id);
          return;
        }
        if (
          message.action !== "infer" ||
          (message.action === "infer" && !streaming)
        ) {
          resolve(message);
          return;
        }
        const done = message.response_type === "full";
        resolve({ value: message, done });
        if (done) {
          this.responseHandlers.delete(request_id);
        }
      } else {
        console.log(
          `Unhandled message '${rawMessage}, request ${request_id} not found.`
        );
      }
    } catch (e) {
      console.error(`Failed handling message:`, data, e);
    }
  }

  send(data) {
    const requestId = ++this.requestId;
    data.request_id = requestId;
    return new Promise((resolve, reject) => {
      this.responseHandlers.set(requestId, {
        resolve,
        reject,
        streaming: data.streaming || false,
      });
      this.socket.send(JSON.stringify(data), (err) => {
        if (err) {
          this.responseHandlers.delete(requestId);
          reject(err);
        }
      });
    });
  }

  async echo() {
    return this.send({
      action: "echo",
    });
  }

  async estimateToken(text) {
    return this.send({
      action: "estimate_token",
      text: text,
    });
  }

  async lefttrimToken(text, trimmedLength) {
    return this.send({
      action: "lefttrim_token",
      text: text,
      trimmed_length: trimmedLength,
    });
  }

  async stop() {
    return this.send({
      action: "stop",
    });
  }

  async infer({
    text,
    maxNewTokens = 512,
    stream = false,
    streamFull = false,
    top_p = 0,
    top_k = 0,
    top_a = 0,
    min_p = 0,
    typical = 0,
    temperature = 1.0,
    repetitionPenalty = 1.0,
    frequencyPenalty = 0.0,
    presencePenalty = 0.0,
    skewFactor = 0.0,
    customBos = "",
    stopConditions = [],
    tokenHealing = false,
    tag = null,
  } = {}) {
    let data = {
      action: "infer",
      text: text,
    };

    data["max_new_tokens"] = maxNewTokens;
    data["stream"] = stream;
    if (streamFull) data["stream_full"] = true;
    if (top_p) data["top_p"] = top_p;
    if (top_k) data["top_k"] = top_k;
    if (top_a) data["top_a"] = top_a;
    if (min_p) data["min_p"] = min_p;
    if (typical) data["typical"] = typical;
    if (temperature !== 1.0) data["temperature"] = temperature;
    if (repetitionPenalty !== 1.0) data["rep_pen"] = repetitionPenalty;
    if (frequencyPenalty) data["freq_pen"] = frequencyPenalty;
    if (presencePenalty) data["pres_pen"] = presencePenalty;
    if (skewFactor) data["skew"] = skewFactor;
    if (customBos) data["customBos"] = customBos;
    if (stopConditions && stopConditions.length > 0)
      data["stop_conditions"] = stopConditions;
    if (tokenHealing) data["token_healing"] = true;
    if (tag) data["tag"] = tag;
    if (stream) {
      return this.inferStream(data);
    }
    return this.send(data);
  }

  async *inferStream(message) {
    const requestId = ++this.requestId;
    message.request_id = requestId;

    // Store the iterator's next function
    let resolveIterator;
    let rejectIterator;
    let iteratorPromise = new Promise((resolve, reject) => {
      resolveIterator = resolve;
      rejectIterator = reject;
    });

    this.responseHandlers.set(requestId, {
      resolve: (value) => resolveIterator({ value, done: false }),
      reject: (err) => resolveIterator({ value: { error: err }, done: true }),
      streaming: true,
    });

    this.socket.send(JSON.stringify(message), (err) => {
      if (err) {
        this.responseHandlers.delete(requestId);
        rejectIterator(err);
      }
    });

    while (true) {
      const { value } = await iteratorPromise;
      yield value.value;
      if (value.done) break;
      // Prepare next promise
      iteratorPromise = new Promise((resolve, reject) => {
        resolveIterator = resolve;
        rejectIterator = reject;
      });

      this.responseHandlers.set(requestId, {
        resolve: (value) => resolveIterator({ value, done: false }),
        reject: (err) => resolveIterator({ value: { error: err }, done: true }),
        streaming: true,
      });
    }
  }
}

module.exports = {
  ExLlamaV2Api,
};
