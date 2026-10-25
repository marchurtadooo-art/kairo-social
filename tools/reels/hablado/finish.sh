#!/bin/bash
# Render y entrega del vídeo hablado.
# uso: ./finish.sh nombre        → out/<nombre>_A_sin-musica.mp4, out/<nombre>_B_con-musica.mp4 y out/<nombre>_ig.mp4 (≤19 MB para Make)
set -e
cd "$(dirname "$0")"
NAME=${1:-hablado}
R="--crf=12 --pixel-format=yuv420p --color-space=bt709 --concurrency=2 --offthreadvideo-cache-size-in-bytes=600000000"
export REMOTION_CHROME=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
npx remotion bundle src/index.ts --out-dir build/bundle >/dev/null 2>&1
npx remotion render build/bundle Hablado out/_raw_A.mp4 $R --browser-executable=$REMOTION_CHROME --props='{"bgm":false}' 2>&1 | tail -1
npx remotion render build/bundle Hablado out/_raw_B.mp4 $R --browser-executable=$REMOTION_CHROME --props='{"bgm":true}' 2>&1 | tail -1

# desfase de audio del render frente a la voz original (correlación cruzada de los primeros 12 s)
OFF=$(python3 - <<'PY'
import subprocess, numpy as np
def pcm(p):
    raw = subprocess.check_output(['ffmpeg','-v','error','-i',p,'-t','12','-ac','1','-ar','8000','-f','s16le','-'])
    return np.frombuffer(raw, np.int16).astype(np.float32)
a, b = pcm('public/media/face.mp4'), pcm('out/_raw_A.mp4')
n = min(len(a), len(b)); a, b = a[:n] - a[:n].mean(), b[:n] - b[:n].mean()
c = np.fft.irfft(np.fft.rfft(b, 2*n) * np.conj(np.fft.rfft(a, 2*n)))
lag = int(np.argmax(np.r_[c[:800], np.zeros(1)]))  # sólo retrasos de 0–100 ms
print(f"{max(0, lag)/8000:.4f}")
PY
)
echo "desfase de audio medido: ${OFF}s"

fin() { # entrada salida
  local IN=$1 OUT=$2 TMP; TMP=$(mktemp --suffix=.wav)
  local DUR; DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
  ffmpeg -v error -y -i "$IN" -af "atrim=start=$OFF,asetpts=PTS-STARTPTS,apad" -t "$DUR" -ar 48000 -c:a pcm_s24le "$TMP"
  local I G; I=$(ffmpeg -nostats -i "$TMP" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
  G=$(python3 -c "print(round(-14.0 - ($I), 2))")
  ffmpeg -v error -y -i "$IN" -i "$TMP" -map 0:v -map 1:a \
    -c:v libx264 -preset slow -crf 17 -maxrate 20M -bufsize 40M -profile:v high -level 4.2 -pix_fmt yuv420p \
    -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
    -af "volume=${G}dB,alimiter=limit=0.85:attack=3:release=60:level=disabled" -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
  rm -f "$TMP"
  echo "$OUT  $(ffmpeg -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E '^\s+I:' | tail -1 | xargs)  $(du -m "$OUT" | cut -f1) MB"
}
fin out/_raw_A.mp4 "out/${NAME}_A_sin-musica.mp4"
fin out/_raw_B.mp4 "out/${NAME}_B_con-musica.mp4"

# copia para la cola de Make (jsDelivr sirve como máximo ~20 MB): dos pasadas a la tasa justa
SRC="out/${NAME}_A_sin-musica.mp4"; [ "$2" = "B" ] && SRC="out/${NAME}_B_con-musica.mp4"
IG="out/${NAME}_ig.mp4"
SIZE=$(stat -c %s "$SRC")
if [ "$SIZE" -le 19000000 ]; then cp "$SRC" "$IG"; else
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
  VB=$(python3 -c "print(int(18.2e6*8/$DUR/1000 - 160))")
  ffmpeg -v error -y -i "$SRC" -c:v libx264 -preset slow -b:v ${VB}k -pass 1 -passlogfile build/x264 -an -f mp4 /dev/null
  ffmpeg -v error -y -i "$SRC" -c:v libx264 -preset slow -b:v ${VB}k -maxrate $((VB*2))k -bufsize $((VB*4))k -pass 2 -passlogfile build/x264 \
    -profile:v high -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -c:a aac -b:a 160k -movflags +faststart "$IG"
fi
echo "$IG  $(du -m "$IG" | cut -f1) MB"
rm -f out/_raw_A.mp4 out/_raw_B.mp4
