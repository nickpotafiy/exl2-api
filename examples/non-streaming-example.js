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
    /*
    OUTPUT EXAMPLE:
    {
      action: 'infer',
      request_id: 1,
      util_text: 'My name is',
      chunk: '',
      stop_reason: 'num_tokens',
      response_type: 'full',
      response: ` Jason, and I'm a big fan of Slack. And I just wanted to share with you guys the reason why I think Slack is so good for remote teams."\n` +
        'How I use Slack to be productive while working remot'
    }
    */
  } catch (e) {
    console.error("Failed connecting to API server!");
    return;
  }
})();
