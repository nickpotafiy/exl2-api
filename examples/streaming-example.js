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
      /*
        CHUNK EXAMPLE
        {
          action: 'infer',
          request_id: 1,
          util_text: 'My name is',
          response_type: 'chunk',
          chunk: ' When'
        }
        FULL EXAMPLE
        {
          action: 'infer',
          request_id: 1,
          util_text: 'My name is',
          response_type: 'full',
          chunk: '',
          stop_reason: 'num_tokens',
          response: " Zafirah and I'm from Russia.\n" +
            'I am a writer, and I have been working in the field of literature for almost 10 years now. I am very much into reading, and love books of all kinds. When'
        }
        */
      console.log(chunk);
    }
    console.log("Infer complete");
  } catch (e) {
    console.error("Failed connecting to API server!");
    return;
  }
})();
