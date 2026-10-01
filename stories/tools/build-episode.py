#!/usr/bin/env python3
"""
Монтажный лист (компактный) → готовые данные для Remotion.

  python3 tools/build-episode.py src/episodes/series-01.montage.json

В монтажном листе видео-сцены описываются ссылками на фразы транскрипта (data/transcripts/full.json):
  {"type": "talkingHead", "cuts": [{"rows": [4, 5, 6]}, {"rows": [8], "from": "потихоньку", "until": "комфортно"}]}
Инструмент сам находит файл и время в исходнике, режет длинные паузы, строит пословные субтитры
(текст берётся из вычитанного транскрипта, тайминги — из распознавания) и считает длительность сцены.
Результат: <имя>.json рядом с монтажным листом.
"""
import difflib, json, re, sys
from pathlib import Path

PAD_START, PAD_END, MAX_GAP, KEEP_GAP = 0.12, 0.30, 0.9, (0.30, 0.22)
FPS = 30


def norm(s: str) -> str:
    s = s.lower().replace('ё', 'е')
    return re.sub(r'[^\w\-–]+', '', s).replace('–', '-')


class Transcript:
    def __init__(self, path):
        d = json.loads(Path(path).read_text())
        self.starts = [(s['id'], s['startOnTimeline'], s['durationSec']) for s in d['sources']]
        self.rows = {r['n']: r for r in d['phrases']}
        self.words = sorted((w for r in d['phrases'] for w in r['words']), key=lambda w: w['start'])
        self.tokens = {n: self._align(r) for n, r in self.rows.items()}

    def src_at(self, u):
        """файл и локальное время для момента u на общей шкале (в зоне повтора берём более поздний файл)"""
        best = None
        for sid, st, dur in self.starts:
            if st - 1e-6 <= u < st + dur - 0.02:
                best = (sid, st)
        if best is None:
            sid, st, dur = self.starts[-1]
            best = (sid, st)
        return best[0], u - best[1]

    def _align(self, row):
        """сопоставляет слова вычитанного текста со словами распознавания (по смыслу, с поправкой на ошибки)"""
        toks, buf = [], None
        for raw in row['text'].split():
            if raw in ('—', '-', '–'):
                continue
            if buf is not None:
                buf.append(raw)
                if raw.endswith(']') or raw.rstrip('.,?!').endswith(']'):
                    toks.append({'display': '…', 'norm': '', 'parts': 1, 'unclear': True}); buf = None
                continue
            if raw.startswith('[') and not raw.rstrip('.,?!:').endswith(']'):
                buf = [raw]; continue
            if raw.startswith('[') and raw.rstrip('.,?!:').endswith(']'):
                toks.append({'display': '…', 'norm': '', 'parts': 1, 'unclear': True}); continue
            n = norm(raw)
            if not n:
                continue
            toks.append({'display': raw, 'norm': n, 'parts': len(n.split('-'))})
        parts = []
        for ti, t in enumerate(toks):
            for pj, p in enumerate(t['norm'].split('-') if t['norm'] else ['']):
                parts.append((ti, p))
        gw = row['words']; gn = [norm(w['text']) for w in gw]
        n, m = len(parts), len(gw)
        sim = lambda a, b: (difflib.SequenceMatcher(None, a, b).ratio() if a and b else 0.2)
        S = [[0.0] * (m + 1) for _ in range(n + 1)]; B = [[None] * (m + 1) for _ in range(n + 1)]
        for i in range(1, n + 1): S[i][0] = -0.3 * i; B[i][0] = 'u'
        for j in range(1, m + 1): S[0][j] = -0.3 * j; B[0][j] = 'l'
        for i in range(1, n + 1):
            for j in range(1, m + 1):
                r = sim(parts[i - 1][1], gn[j - 1]); sc = r if r > 0.5 else -0.6
                c = [(S[i - 1][j - 1] + sc, 'd'), (S[i - 1][j] - 0.3, 'u'), (S[i][j - 1] - 0.3, 'l')]
                S[i][j], B[i][j] = max(c)
        i, j, match = n, m, {}
        while i > 0 or j > 0:
            b = B[i][j]
            if b == 'd':
                if sim(parts[i - 1][1], gn[j - 1]) > 0.5: match[i - 1] = j - 1
                i -= 1; j -= 1
            elif b == 'u': i -= 1
            else: j -= 1
        # время каждой части: найденное, иначе интерполяция между соседями
        times = [None] * n
        for pi, gj in match.items(): times[pi] = (gw[gj]['start'], gw[gj]['end'])
        for pi in range(n):
            if times[pi] is None:
                l = next((k for k in range(pi - 1, -1, -1) if times[k]), None)
                r = next((k for k in range(pi + 1, n) if times[k]), None)
                a = times[l][1] if l is not None else row['start']
                b = times[r][0] if r is not None else row['end']
                gap = [k for k in range(n) if times[k] is None and (l is None or k > l) and (r is None or k < r)]
                idx = gap.index(pi); w = (b - a) / max(1, len(gap))
                times[pi] = (a + w * idx, a + w * (idx + 1))
        out, pi = [], 0
        for t in toks:
            k = t['parts'] if t['norm'] else 1
            seg = times[pi:pi + k]; pi += k
            out.append({**t, 'start': seg[0][0], 'end': seg[-1][1]})
        return out


def build_cut(tr: Transcript, cut, scene_t0):
    toks = []
    for rn in cut['rows']:
        toks += tr.tokens[rn]
    def find(anchor, nth=1, after=0):
        a = norm(anchor); c = 0
        for i in range(after, len(toks)):
            if toks[i]['norm'] == a or (toks[i]['norm'] and toks[i]['norm'].startswith(a)):
                c += 1
                if c == nth: return i
        raise SystemExit(f'не найдено слово «{anchor}» в строках {cut["rows"]}')
    i0 = find(cut['from'], cut.get('fromNth', 1)) if 'from' in cut else 0
    i1 = find(cut['until'], cut.get('untilNth', 1), i0) if 'until' in cut else len(toks) - 1
    toks = toks[i0:i1 + 1]
    a, b = toks[0]['start'], toks[-1]['end']
    # соседи по времени — чтобы не захватить чужую речь
    prev_end = max((w['end'] for w in tr.words if w['end'] <= a + 0.01 and w['start'] < a - 0.02), default=a - 1)
    next_start = min((w['start'] for w in tr.words if w['start'] >= b - 0.01 and w['end'] > b + 0.02), default=b + 1)
    s = max(a - cut.get('padStart', PAD_START), prev_end + 0.02)
    e = min(b + cut.get('padEnd', PAD_END), next_start - 0.03)
    # режем длинные паузы внутри реплики
    pieces, cur = [], [s, None]
    for t0, t1 in zip(toks, toks[1:]):
        if t1['start'] - t0['end'] > cut.get('maxGap', MAX_GAP):
            pieces.append((cur[0], t0['end'] + KEEP_GAP[0])); cur = [t1['start'] - KEEP_GAP[1], None]
    pieces.append((cur[0], e))
    # режем на стыках файлов
    segs = []
    for p0, p1 in pieces:
        bounds = [st for _, st, _ in tr.starts if p0 < st < p1] + [p1]
        x = p0
        for bd in bounds:
            sid, l0 = tr.src_at(x + 1e-4)
            segs.append({'src': sid, 'from': round(l0, 3), 'to': round(l0 + (bd - x), 3), 'u0': x, 'u1': bd}); x = bd
    caps, t = [], scene_t0
    def scene_time(u):
        acc = scene_t0
        for sg in segs:
            if sg['u0'] - 0.001 <= u <= sg['u1'] + 0.001: return acc + (u - sg['u0'])
            acc += sg['u1'] - sg['u0']
        return None
    for tk in toks:
        ts, te = scene_time(tk['start']), scene_time(tk['end'])
        if ts is None: ts = scene_time(min(max(tk['start'], segs[0]['u0']), segs[-1]['u1']))
        if te is None: te = ts + 0.3
        caps.append({'text': tk['display'], 'start': round(ts, 3), 'end': round(max(te, ts + 0.12), 3), 'norm': tk['norm']})
    length = sum(sg['u1'] - sg['u0'] for sg in segs)
    return [{'src': g['src'], 'from': g['from'], 'to': g['to']} for g in segs], caps, length


def anchor_time(caps, spec, default=0.0, end_of=False):
    if isinstance(spec, (int, float)): return float(spec)
    n, k = norm(spec['word']), spec.get('nth', 1); c = 0
    end_of = spec['edge'] == 'end' if 'edge' in spec else end_of
    for cp in caps:
        if cp['norm'] == n or (cp['norm'] and cp['norm'].startswith(n)):
            c += 1
            if c == k: return (cp['end'] if end_of else cp['start']) + spec.get('offset', 0.0)
    raise SystemExit(f'не найдено слово-якорь «{spec["word"]}»')


def main(path):
    src = json.loads(Path(path).read_text())
    base = Path(path).parent.parent.parent
    tr = Transcript(base / src.get('transcript', 'data/transcripts/full.json'))
    out = {'id': src['id'], 'title': src['title'], 'fps': FPS, 'stories': []}
    for st in src['stories']:
        scenes, total = [], 0.0
        for sc in st['scenes']:
            sc = dict(sc)
            if sc['type'] in ('talkingHead', 'video', 'broll') and 'cuts' in sc:
                segs, caps, t = [], [], 0.0
                for cut in sc.pop('cuts'):
                    sg, cp, ln = build_cut(tr, cut, t); segs += sg; caps += cp; t += ln
                sc['segments'], sc['captions'], dur = segs, caps, t
                ov = []
                for o in sc.get('overlays', []):
                    o = dict(o)
                    s0 = anchor_time(caps, o.get('at', 0))
                    if 'until' in o: s1 = anchor_time(caps, o['until'], end_of=True)
                    elif 'dur' in o: s1 = s0 + o['dur']
                    else: s1 = dur
                    o['start'], o['end'] = round(s0, 3), round(min(s1, dur), 3)
                    for k in ('at', 'until', 'dur'): o.pop(k, None)
                    ov.append(o)
                if ov: sc['overlays'] = ov
                hl = {norm(h) for h in sc.get('highlight', [])}
                tail = sc.get('accentTail')
                tail_i = next((i for i, cp in enumerate(caps) if tail and cp['norm'].startswith(norm(tail['fromWord']))), None)
                for i, cp in enumerate(caps):
                    if cp['norm'] in hl or (tail_i is not None and i >= tail_i): cp['accent'] = True
                    cp.pop('norm', None)
                sc.pop('highlight', None); sc.pop('accentTail', None)
                sc['durationSec'] = round(dur, 3)
            total += sc['durationSec']
            scenes.append(sc)
        out['stories'].append({'id': st['id'], 'title': st['title'], 'scenes': scenes, 'durationSec': round(total, 3)})
        print(f"{st['id']}: {total:5.1f} с  {st['title']}")
    dst = Path(path).with_name(Path(path).name.replace('.montage', ''))
    dst.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print('→', dst)


if __name__ == '__main__':
    main(sys.argv[1])
