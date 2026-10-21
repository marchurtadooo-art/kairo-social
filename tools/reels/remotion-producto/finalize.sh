#!/bin/bash
# Mezcla final, vídeo sin recodificar (con etiquetas bt709 completas en el flujo H.264).
#  · con música: +GAIN dB y limitador (≈ −1,2 dBTP medidos) → ≈ −14 LUFS
#  · sin música: misma ganancia recortada a lo que permita el pico (sin limitador: no aplasta los golpes)
# uso: ./finalize.sh con_musica.mp4 sin_musica.mp4 salida_con.mp4 salida_sin.mp4
set -e
GAIN=${GAIN:-7.2}
BSF="h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1"
ffmpeg -v error -y -i "$1" -map 0:v -map 0:a -c:v copy -bsf:v "$BSF" \
  -af "volume=${GAIN}dB,alimiter=limit=0.79:attack=4:release=60:level=disabled" \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$3"
PEAK=$(ffmpeg -i "$2" -af volumedetect -f null - 2>&1 | sed -n 's/.*max_volume: \(-*[0-9.]*\) dB/\1/p')
G2=$(python3 -c "print(round(min($GAIN, -1.5 - $PEAK), 2))")
ffmpeg -v error -y -i "$2" -map 0:v -map 0:a -c:v copy -bsf:v "$BSF" -af "volume=${G2}dB" \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$4"
echo "ganancia sin música: ${G2} dB"
for f in "$3" "$4"; do echo "$f"; ffmpeg -nostats -i "$f" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2; done
