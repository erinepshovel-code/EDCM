import type { EDCMResult, Mode } from "../../../shared/edcm-types";
import { addAnalyticsEvent, getSettings } from "./analytics";

export async function runEdcmAndLog(params: {
  mode: Mode;
  text: string;
  sessionId: string;
}) {
  const res = await fetch("/api/edcm/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: params.mode,
      enable_analysis: true,
      text: params.text
    })
  });

  const data = (await res.json()) as EDCMResult;

  const settings = await getSettings();

  const ev = await addAnalyticsEvent({
    result: data,
    sessionId: params.sessionId,
    rawText: settings.allowTextUpload ? params.text : undefined
  });

  if (settings.cloudSync !== "off") {
    await fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sync_mode: settings.cloudSync,
        allow_text_upload: settings.allowTextUpload,
        event: ev
      })
    });
  }

  return data;
}
