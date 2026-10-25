"""Prepara la grabación de un vídeo hablado para la plantilla.

uso:
  python3 prepare.py transcribe clip1.mp4 [clip2.mp4 ...]   → work/joined.mp4 + work/words_raw.json + work/transcript.txt
  python3 prepare.py align guion.txt                         → work/display.json (subtítulos con el texto del guion) + candidatas a cortar
  python3 prepare.py cut [--drop 12-30,85-91]               → public/media/face.mp4, src/words.json, src/face-track.json

1. Une los clips en orden, los pasa a 1080×1920 a 30 fps (si vienen en HDR HLG/PQ, a SDR BT.709 neutro) y saca el audio a 48 kHz.
2. Transcribe con Vosk (español, tiempos por palabra).
3. Corte: quita los tramos de palabras indicados en --drop (repeticiones y tomas falsas, elegidos leyendo la transcripción),
   aprieta las pausas largas (>0,30 s → 0,12 s) y une con fundidos de audio de 10 ms. La voz se limpia (filtro de graves,
   reducción de ruido, ecualización, compresión) y se normaliza a −16 LUFS.
4. Sigue la cara (OpenCV) para que la tarjeta de la plantilla encuadre bien aunque grabe andando.
"""
import glob, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

H = Path('/home/claude/kairo-ig/hablado')
W = H / 'work'
W.mkdir(exist_ok=True)
ASR = glob.glob('/home/claude/kairo-ig/dia/asr/*/')[0]
SDR_VF = ("zscale=tin=bt709:t=linear:pin=bt2020:min=bt2020nc:rin=tv,format=gbrpf32le,"
          "zscale=p=bt709:t=bt709:m=bt709:r=tv,format=yuv420p,")
TAGS = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv']
VOICE_AF = ("highpass=f=85,afftdn=nf=-30,equalizer=f=220:t=q:w=1.2:g=-1.5,equalizer=f=3500:t=q:w=1.0:g=2.0,"
            "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=7")


def sh(*a, **k):
    return subprocess.run(list(a), check=True, **k)


def probe_trc(p):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=color_transfer', '-of', 'csv=p=0', p]).decode().strip()
    return out


def transcribe(clips):
    parts = []
    for i, c in enumerate(clips):
        hdr = probe_trc(c) in ('arib-std-b67', 'smpte2084')
        vf = (SDR_VF if hdr else '') + "fps=30,scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,setsar=1,format=yuv420p"
        out = W / f'part{i:02d}.mp4'
        sh('ffmpeg', '-v', 'error', '-y', '-i', c, '-vf', vf, '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-g', '15', *TAGS,
           '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '192k', str(out))
        parts.append(out)
        print('normalizado', c, 'HDR→SDR' if hdr else 'SDR', flush=True)
    lst = W / 'parts.txt'
    lst.write_text(''.join(f"file '{p}'\n" for p in parts))
    sh('ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', str(W / 'joined.mp4'))
    sh('ffmpeg', '-v', 'error', '-y', '-i', str(W / 'joined.mp4'), '-ac', '1', '-ar', '16000', str(W / 'asr.wav'))
    from vosk import Model, KaldiRecognizer, SetLogLevel
    SetLogLevel(-1)
    wf = wave.open(str(W / 'asr.wav'), 'rb')
    rec = KaldiRecognizer(Model(ASR), wf.getframerate()); rec.SetWords(True)
    res = []
    while True:
        d = wf.readframes(4000)
        if not d: break
        if rec.AcceptWaveform(d): res.append(json.loads(rec.Result()))
    res.append(json.loads(rec.FinalResult()))
    words = [{'w': w['word'], 's': round(w['start'], 3), 'e': round(w['end'], 3), 'c': round(w.get('conf', 1), 2)} for r in res for w in r.get('result', [])]
    json.dump(words, open(W / 'words_raw.json', 'w'), ensure_ascii=False)
    with open(W / 'transcript.txt', 'w') as fh:
        for i, w in enumerate(words):
            fh.write(f"{i}:{w['w']}@{w['s']:.2f} ")
            if i + 1 < len(words) and words[i + 1]['s'] - w['e'] > 0.6: fh.write('\n')
    print('palabras', len(words), '→ work/transcript.txt', flush=True)


def _norm(t):
    import unicodedata, re
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(ch for ch in t if unicodedata.category(ch) != 'Mn')
    return re.sub(r'[^a-z0-9ñ]', '', t)


def align(script_path):
    """Alinea la transcripción con el guion: los subtítulos usan el texto del guion (tildes, mayúsculas, signos,
    nombres como KAIRO que Vosk no conoce) y las palabras que sobran (repeticiones, tomas falsas) salen como sugerencia de corte."""
    import difflib, re
    words = json.load(open(W / 'words_raw.json'))
    disp_tokens = re.findall(r"\S+", open(script_path).read())
    sn = [_norm(t) for t in disp_tokens]
    vn = [_norm(w['w']) for w in words]
    num = {'8': 'ocho', '10': 'diez', '21': 'veintiuno', '5': 'cinco'}
    sn = [num.get(t, t) for t in sn]
    sm = difflib.SequenceMatcher(None, vn, sn, autojunk=False)
    display, extra = {}, []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'equal' or (op == 'replace' and i2 - i1 == j2 - j1):
            for k in range(i2 - i1): display[str(i1 + k)] = disp_tokens[j1 + k]
        elif op == 'replace':  # reparte las palabras del guion entre las reconocidas, en orden
            n_i, n_j = i2 - i1, j2 - j1
            for k in range(n_i):
                a, b = round(k * n_j / n_i), round((k + 1) * n_j / n_i)
                display[str(i1 + k)] = ' '.join(disp_tokens[j1 + a:j1 + b]) or '·'
        elif op == 'insert' and i1 > 0:  # el guion dice algo que Vosk no oyó: se pega a la palabra anterior
            display[str(i1 - 1)] = display.get(str(i1 - 1), words[i1 - 1]['w']) + ' ' + ' '.join(disp_tokens[j1:j2])
        elif op == 'delete':
            extra.append((i1, i2 - 1, ' '.join(w['w'] for w in words[i1:i2])))
    json.dump(display, open(W / 'display.json', 'w'), ensure_ascii=False, indent=0)
    print(f'coincidencia con el guion: {sm.ratio():.0%}')
    print('palabras fuera de guion (candidatas a cortar):')
    for a, b, t in extra: print(f'  {a}-{b}: {t}')
    print('→ work/display.json')


def cut(drop_spec='', display=None):
    words = json.load(open(W / 'words_raw.json'))
    drop = set()
    for part in filter(None, drop_spec.split(',')):
        a, _, b = part.partition('-')
        drop.update(range(int(a), int(b or a) + 1))
    keep = [dict(w, i=i) for i, w in enumerate(words) if i not in drop]
    if display is None and (W / 'display.json').exists():
        display = json.load(open(W / 'display.json'))
    if display:  # texto de los subtítulos según el guion {índice: texto}
        for w in keep:
            if str(w['i']) in display: w['w'] = display[str(w['i'])]
        keep = [w for w in keep if w['w'] != '·']
    # tramos: palabras seguidas (hueco ≤ 0,30 s y sin palabras quitadas en medio) forman un bloque
    chunks = []
    for w in keep:
        if chunks and w['s'] - chunks[-1]['e'] <= 0.30 and w['i'] == chunks[-1]['last'] + 1:
            chunks[-1]['e'] = w['e']; chunks[-1]['last'] = w['i']; chunks[-1]['words'].append(w)
        else:
            chunks.append({'s': w['s'], 'e': w['e'], 'last': w['i'], 'words': [w]})
    PRE, POST, GAP = 0.10, 0.14, 0.12
    segs, t, out_words = [], 0.0, []
    for k, c in enumerate(chunks):
        a, b = max(0, c['s'] - PRE), c['e'] + POST
        if segs and a < segs[-1][1]: a = segs[-1][1]
        if k > 0: t += GAP
        for w in c['words']:
            out_words.append({'w': w['w'], 's': round(t + (w['s'] - a), 3), 'e': round(t + (w['e'] - a), 3)})
        segs.append((a, b, t)); t += b - a
    # vídeo: cortes secos con hueco corto; audio: mismos tramos con fundidos de 10 ms
    filt, vlab, alab = [], [], []
    for i, (a, b, _) in enumerate(segs):
        filt.append(f"[0:v]trim={a:.3f}:{b + (GAP if i + 1 < len(segs) else 0):.3f},setpts=PTS-STARTPTS[v{i}]")
        filt.append(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={max(0, b - a - 0.01):.3f}:d=0.01,apad=pad_dur={GAP if i + 1 < len(segs) else 0}[a{i}]")
        vlab.append(f'[v{i}]'); alab.append(f'[a{i}]')
    filt.append(''.join(vlab) + f"concat=n={len(segs)}:v=1:a=0[vo]")
    filt.append(''.join(alab) + f"concat=n={len(segs)}:v=0:a=1,{VOICE_AF}[ao]")
    (W / 'cut.filter').write_text(';\n'.join(filt))
    out = H / 'public/media/face.mp4'
    out.unlink(missing_ok=True)  # nunca escribir encima: si fuera un enlace duro se machacaría el original
    sh('ffmpeg', '-v', 'error', '-y', '-i', str(W / 'joined.mp4'), '-filter_complex_script', str(W / 'cut.filter'), '-map', '[vo]', '-map', '[ao]',
       '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-g', '15', *TAGS, '-c:a', 'aac', '-ar', '48000', '-b:a', '192k', str(out))
    json.dump(out_words, open(H / 'src/words.json', 'w'), ensure_ascii=False)
    track_face(out)
    cfg = json.load(open(H / 'src/config.json')); cfg['placeholder'] = False
    json.dump(cfg, open(H / 'src/config.json', 'w'), indent=1)
    print('montaje', round(t, 2), 's ·', len(segs), 'tramos ·', len(out_words), 'palabras', flush=True)


def track_face(path):
    """Centro de la cara a lo largo del vídeo (Haar de OpenCV, 1 de cada 3 frames), robusto a falsos positivos:
    se ancla en la zona donde más veces aparece una cara, en cada muestra se elige el candidato más cercano a la
    estimación anterior (los saltos grandes se descartan) y la trayectoria se suaviza para que la tarjeta no tiemble."""
    import cv2
    cas = cv2.CascadeClassifier(str(H / 'build/models/haarcascade_frontalface_default.xml'))
    cap = cv2.VideoCapture(str(path))
    samples, i = [], 0
    while True:
        ok, fr = cap.read()
        if not ok: break
        if i % 3 == 0:
            g = cv2.equalizeHist(cv2.cvtColor(cv2.resize(fr, (360, 640)), cv2.COLOR_BGR2GRAY))
            fs = cas.detectMultiScale(g, 1.08, 6, minSize=(48, 48))
            samples.append((i / 30, [((x + w / 2) * 3, (y + h / 2) * 3, w * 3) for x, y, w, h in fs]))
        i += 1
    cands = [c for _, cs in samples for c in cs]
    if not cands:
        json.dump([], open(H / 'src/face-track.json', 'w')); print('sin cara detectada: encuadre fijo', flush=True); return
    hist = {}
    for cx, cy, _ in cands: hist[(int(cx // 120), int(cy // 120))] = hist.get((int(cx // 120), int(cy // 120)), 0) + 1
    bx, by = max(hist, key=hist.get)
    near = [c for c in cands if abs(c[0] - (bx + .5) * 120) < 180 and abs(c[1] - (by + .5) * 120) < 180]
    est = np.median(np.array(near), 0)
    pts = []
    for t, cs in samples:
        if cs:
            c = min(cs, key=lambda c: np.hypot(c[0] - est[0], c[1] - est[1]))
            if np.hypot(c[0] - est[0], c[1] - est[1]) < 260:
                est = 0.6 * est + 0.4 * np.array(c)
                pts.append((t, *c))
    if len(pts) < 3:
        json.dump([], open(H / 'src/face-track.json', 'w')); print('cara poco fiable: encuadre fijo', flush=True); return
    arr = np.array(pts)
    k = 6
    sm = arr.copy()
    for j in range(len(arr)):
        lo, hi = max(0, j - k), min(len(arr), j + k + 1)
        sm[j, 1:] = arr[lo:hi, 1:].mean(0)
    json.dump([{'t': round(float(t), 3), 'cx': round(float(cx)), 'cy': round(float(cy)), 'size': round(float(s))} for t, cx, cy, s in sm],
              open(H / 'src/face-track.json', 'w'))
    print(f'cara en {len(pts)}/{len(samples)} muestras; centro medio', int(np.median(arr[:, 1])), int(np.median(arr[:, 2])), flush=True)


if __name__ == '__main__':
    if sys.argv[1] == 'transcribe':
        transcribe(sys.argv[2:])
    elif sys.argv[1] == 'align':
        align(sys.argv[2])
    elif sys.argv[1] == 'cut':
        spec = sys.argv[sys.argv.index('--drop') + 1] if '--drop' in sys.argv else ''
        disp = json.load(open(sys.argv[sys.argv.index('--display') + 1])) if '--display' in sys.argv else None
        cut(spec, disp)
