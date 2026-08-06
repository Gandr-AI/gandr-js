/**
 * Gandr TTS — official JavaScript client. Zero dependencies, Node 18+ and browsers.
 *
 *   import { Gandr } from "gandr";
 *   const g = new Gandr("gnd_...");
 *   const wav = await g.say("Your table is confirmed for Thursday at seven.");
 *   // wav is a Uint8Array of a WAV file — write it, stream it, play it.
 *
 * Docs: https://gandr.ai/docs
 */

const DOORS = [
  "https://tts.gandr.ai", // West (primary)
  "https://tts-nyc.gandr.ai", // NYC
  "https://tts-eu.gandr.ai", // EU
];

export const VOICES = Object.freeze([
  "gandr-ava", "gandr-dane", "gandr-jenny",
  "gandr-leo", "gandr-lewis", "gandr-mia",
]);

export class GandrError extends Error {
  constructor(status, payload) {
    const msg = payload && typeof payload === "object" ? payload.error : payload;
    const hint = payload && typeof payload === "object" ? payload.hint : "";
    super(`[${status}] ${msg || "request failed"}${hint ? ` — ${hint}` : ""}`);
    this.status = status;
    this.payload = payload;
  }
}

export class Gandr {
  /** One instance per API key. Doors fail over automatically. */
  constructor(apiKey, { timeout = 60000 } = {}) {
    if (!apiKey) throw new Error("apiKey is required — get one at https://gandr.ai");
    this.apiKey = apiKey;
    this.timeout = timeout;
  }

  /**
   * Render text to a WAV file (Uint8Array).
   * text: up to 2000 characters.
   * voice: one of VOICES. sampleRate: 8000–48000, resampled server-side.
   * temperature: 0.1–1.2 pitch range. cfgWeight: 0.2–1.0 pacing.
   * speed: 0.6–1.5. volume: 0.5–2.0.
   * pronunciation: [{ text: "Nguyen", pronunciation: "win" }] — sounds-like.
   */
  async say(text, {
    voice = "gandr-ava", language = "en", sampleRate = 24000,
    temperature, cfgWeight, speed, volume, pronunciation,
  } = {}) {
    if (!text || !text.trim()) throw new Error("text must not be empty");
    if (text.length > 2000) {
      throw new Error("text is over the 2000-character request cap — split it");
    }
    const body = {
      transcript: text,
      language,
      voice: { mode: "id", id: voice },
      output_format: { sample_rate: sampleRate },
    };
    if (temperature !== undefined) body.temperature = temperature;
    if (cfgWeight !== undefined) body.cfg_weight = cfgWeight;
    if (speed !== undefined) body.speed = speed;
    if (volume !== undefined) body.volume = volume;
    if (pronunciation) body.pronunciation_dict = pronunciation;
    const res = await this.#request("POST", "/v1/tts/bytes", body);
    return new Uint8Array(await res.arrayBuffer());
  }

  /** Voice catalog (never wakes the fleet). */
  async voices() {
    return (await this.#request("GET", "/v1/voices")).json();
  }

  /** Characters used vs quota for this key. May wake a cold fleet. */
  async usage() {
    return (await this.#request("GET", "/v1/usage")).json();
  }

  async #request(method, path, body) {
    let lastError;
    for (const door of DOORS) {
      try {
        const res = await fetch(door + path, {
          method,
          headers: { "x-api-key": this.apiKey, "content-type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(this.timeout),
        });
        if (!res.ok) {
          let payload;
          try { payload = await res.json(); } catch { payload = res.statusText; }
          throw new GandrError(res.status, payload); // a real answer — no failover
        }
        return res;
      } catch (err) {
        if (err instanceof GandrError) throw err;
        lastError = err; // door unreachable — try the next region
      }
    }
    throw new GandrError(0, `all doors unreachable: ${lastError}`);
  }
}

export default Gandr;
