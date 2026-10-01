#!/usr/bin/env python3
"""
Транскрипция русской речи с таймкодами на слова — офлайн, без внешних API.

  python3 tools/transcribe.py <видео> [<видео> ...] --out data/transcripts

Модели (sherpa-onnx, скачиваются с GitHub Releases, один раз в ~/.cache/abricot-asr):
  • GigaAM v2 (RNNT, русский)  — тайминги слов
  • Whisper turbo              — пунктуация и регистр

Результат: <имя>.json формата Transcript (см. src/lib/types.ts) + <имя>.review.md для вычитки.
GigaAM даёт точные тайминги, но без пунктуации; Whisper даёт пунктуацию, но тайминги только на кусок.
Поэтому в JSON лежат оба текста: `text` (Whisper) и слова с таймингами (GigaAM). Спорные места
подсвечиваются в review.md — их вычитывает человек перед монтажом.
"""
import argparse, json, re, subprocess, sys, tarfile, urllib.request, wave
from pathlib import Path

import numpy as np
import sherpa_onnx

REL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/"
CACHE = Path.home() / ".cache" / "abricot-asr"
GIGA = "sherpa-onnx-nemo-transducer-giga-am-v2-russian-2025-04-19"
TURBO = "sherpa-onnx-whisper-turbo"
MAX_CHUNK = 22.0  # модели рассчитаны на ~30 c; режем по паузам


def fetch(name: str) -> Path:
    d = CACHE / name
    if d.exists():
        return d
    CACHE.mkdir(parents=True, exist_ok=True)
    tar = CACHE / f"{name}.tar.bz2"
    print(f"скачиваю {name} …", file=sys.stderr)
    urllib.request.urlretrieve(REL + f"{name}.tar.bz2", tar)
    with tarfile.open(tar) as t:
        t.extractall(CACHE)
    tar.unlink()
    return d


def to_wav(src: Path, dst: Path) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ac", "1", "-ar", "16000", str(dst)], check=True)


def read_wav(p: Path):
    w = wave.open(str(p))
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return a, w.getframerate()


def silences(p: Path):
    err = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(p), "-af", "silencedetect=noise=-35dB:d=0.3", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    s = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    e = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    return list(zip(s, e))


def chunk_bounds(dur: float, sil):
    cuts = [(a + b) / 2 for a, b in sil if 0.5 < (a + b) / 2 < dur - 0.5]
    out, start = [], 0.0
    for i, c in enumerate(cuts):
        nxt = cuts[i + 1] if i + 1 < len(cuts) else dur
        if nxt - start > MAX_CHUNK:
            out.append((start, c))
            start = c
    out.append((start, dur))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("videos", nargs="+")
    ap.add_argument("--out", default="data/transcripts")
    ap.add_argument("--pause", type=float, default=0.35, help="пауза (с), после которой начинается новая фраза")
    args = ap.parse_args()

    g, t = fetch(GIGA), fetch(TURBO)
    giga = sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=str(g / "encoder.int8.onnx"), decoder=str(g / "decoder.onnx"), joiner=str(g / "joiner.onnx"),
        tokens=str(g / "tokens.txt"), num_threads=4, model_type="nemo_transducer",
    )
    whisper = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(t / "turbo-encoder.int8.onnx"), decoder=str(t / "turbo-decoder.int8.onnx"),
        tokens=str(t / "turbo-tokens.txt"), language="ru", task="transcribe", num_threads=4,
    )

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    for v in map(Path, args.videos):
        wav = out_dir / f".{v.stem}.wav"
        to_wav(v, wav)
        audio, sr = read_wav(wav)
        dur = len(audio) / sr
        words, punct = [], []
        for s, e in chunk_bounds(dur, silences(wav)):
            s0, e0 = max(0.0, s - 0.15), min(dur, e + 0.15)
            x = audio[int(s0 * sr): int(e0 * sr)]
            sg = giga.create_stream(); sg.accept_waveform(sr, x); giga.decode_stream(sg)
            sw = whisper.create_stream(); sw.accept_waveform(sr, x); whisper.decode_stream(sw)
            punct.append({"start": round(s, 2), "end": round(e, 2), "text": sw.result.text.strip()})
            cur, st = "", None
            for tok, ts in zip(sg.result.tokens, sg.result.timestamps):
                if tok == " ":
                    if cur:
                        words.append({"text": cur, "start": round(st + s0, 2)})
                        cur, st = "", None
                    continue
                if st is None:
                    st = ts
                cur += tok
            if cur:
                words.append({"text": cur, "start": round(st + s0, 2)})
        wav.unlink()

        # конец слова = начало следующего (но не дальше 0.6 c), последнее слово — +0.5 c
        for i, w in enumerate(words):
            nxt = words[i + 1]["start"] if i + 1 < len(words) else dur
            w["end"] = round(min(nxt, w["start"] + 0.6) if i + 1 < len(words) else min(dur, w["start"] + 0.5), 2)

        phrases, cur = [], []
        for w in words:
            if cur and w["start"] - cur[-1]["end"] >= args.pause:
                phrases.append(cur); cur = []
            cur.append(w)
        if cur:
            phrases.append(cur)
        data = {
            "source": v.name,
            "durationSec": round(dur, 2),
            "punctuated": punct,
            "phrases": [
                {"start": p[0]["start"], "end": p[-1]["end"], "text": " ".join(w["text"] for w in p), "words": p}
                for p in phrases
            ],
        }
        (out_dir / f"{v.stem}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))
        print(f"{v.name}: {len(words)} слов, {len(phrases)} фраз, {dur:.2f} c")


if __name__ == "__main__":
    main()
