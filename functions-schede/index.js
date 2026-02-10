const { onRequest } = require("firebase-functions/v2/https");
const { estrazioneSchedaCisternaHandler } = require("./estrazioneSchedaCisterna");
const { cisternaDocumentiExtractHandler } = require("./cisternaDocumentiExtract");

exports.estrazioneSchedaCisterna = onRequest(
  { timeoutSeconds: 240, memory: "1GiB", cors: true },
  estrazioneSchedaCisternaHandler
);

exports.cisterna_documenti_extract = onRequest(
  { timeoutSeconds: 240, memory: "1GiB", cors: true },
  cisternaDocumentiExtractHandler
);
