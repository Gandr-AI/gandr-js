# gandr

Official Python & JavaScript clients for the **Gandr TTS API** — text to speech built for voice agents.

- **116 ms** to first audio byte (p50, server-side, warm) — 146 ms measured over the open internet
- **WER 1.982%** on a 1,088-line set — the human recordings score 2.171% on the same scorer
- **$10 per million characters**, or flat unmetered stream plans
- **Every render watermarked** (imperceptible, detectable)
- Numbers, dates, addresses, and order IDs read back correctly
- Three regions with automatic failover — the client fails over for you

## Install

```bash
pip install gandr        # Python 3.9+, zero dependencies
npm install gandr        # Node 18+, zero dependencies
```

## First call (under a minute)

**Python**

```python
from gandr import Gandr

g = Gandr("gnd_...")  # your API key — https://gandr.ai
audio = g.say("Your table for two is confirmed for Thursday at seven.")
open("confirmation.wav", "wb").write(audio)
```

**JavaScript**

```js
import { Gandr } from "gandr";

const g = new Gandr("gnd_...");
const wav = await g.say("Your table for two is confirmed for Thursday at seven.");
// wav is a Uint8Array of a WAV file
```

## Options

```python
g.say(
    "Order number 4-2-7-1 ships on March 3rd.",
    voice="gandr-jenny",        # ava, dane, jenny, leo, lewis, mia
    sample_rate=8000,           # 8000–48000, resampled server-side (telephony: 8000)
    temperature=0.9,            # 0.1–1.2 — pitch range / melody
    cfg_weight=0.4,             # 0.2–1.0 — pacing (lower = more spacious)
    speed=1.1,                  # 0.6–1.5
    pronunciation=[{"text": "Nguyen", "pronunciation": "win"}],
)
```

Omit a dial and you get the tuned default — per-voice temperature tuning included.

## Voices

| | |
|---|---|
| `gandr-ava` | `gandr-leo` |
| `gandr-dane` | `gandr-lewis` |
| `gandr-jenny` | `gandr-mia` |

`g.voices()` returns the live catalog.

## Failover

The client walks West → NYC → EU on unreachable doors. A real answer — including an error — is never retried against another region, so you always see the door's own response.

## Errors

```python
from gandr import Gandr, GandrError

try:
    g.say("...")
except GandrError as e:
    e.status    # 401 invalid key · 402 quota spent · 400 bad input · 429 concurrency
    e.payload   # the door's JSON, with a hint field
```

## Honest limits

- One request carries up to **2,000 characters** — split longer text at sentence boundaries.
- The fleet runs always-on, so the numbers above are what you get: no cold-start lottery on the demo or the API. Overflow traffic spills to a fallback lane that can take longer on its first request.
- The streaming WebSocket lane (`wss://tts.gandr.ai/ws`) is what voice agents should use — first audio byte in the numbers above. This SDK's `say()` returns the complete file, which suits batch and IVR work.

## Links

- Product: https://gandr.ai · Docs: https://gandr.ai/docs
- API spec: https://gandr.ai/openapi.yml · Status: https://gandr.ai/status
- Security disclosures: https://gandr.ai/.well-known/security.txt
