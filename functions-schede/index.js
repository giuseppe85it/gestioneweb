const { onRequest } = require("firebase-functions/v2/https");
const { estrazioneSchedaCisternaHandler } = require("./estrazioneSchedaCisterna");

exports.estrazioneSchedaCisterna = onRequest(
  { timeoutSeconds: 240, memory: "1GiB", cors: true },
  estrazioneSchedaCisternaHandler
);
