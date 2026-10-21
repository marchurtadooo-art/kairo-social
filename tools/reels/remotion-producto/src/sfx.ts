// Tabla de SFX (fase 6, imagen bloqueada). Cada entrada apunta al frame donde debe sonar el PICO,
// relativo a SHOTS/EV; sfxFrom resta el retraso de pico propio de cada archivo (medido con numpy)
// y el desfase de salida AAC del render (≈1,28 f, a verificar con correlación tras el render).
import { EV, SHOTS } from './timeline';
import { ODO_LOCKS } from './components/Odometer';

export type Sfx = { from: number; src: string; volume: number; dur?: number };

const OUTPUT_AUDIO_OFFSET_F = 1.28;
const PEAK_F: Record<string, number> = {
  'transition-soft.mp3': 13.0, 'swoosh-quick.mp3': 8.9, 'air-woosh-quick.mp3': 7.2, 'click-camera.mp3': 5.8,
  'shimmer-sparkle-sweep.mp3': 29.4, 'sparkle-touch.mp3': 14.2, 'hit-weak.mp3': 4.5, 'bass-hit-short.mp3': 2.6,
  'switch-tap.mp3': 0.1, 'pop.mp3': 1.0, 'lock-quick.mp3': 0.3,
};
// Medido por correlación en el render v3: los SFX que empiezan a partir de ~f880 salen +2,1 f más tarde
// que el resto (los anteriores, +0,1 f). Causa sin identificar en el ensamblado de audio; se compensa aquí
// y se verifica de nuevo en el render final.
const LATE_ZONE_FROM = 840;
const LATE_ZONE_EXTRA_F = 2;
const at = (peak: number, src: string, volume: number, dur?: number): Sfx => ({
  from: Math.max(0, Math.round(peak - (PEAK_F[src] ?? 0) - OUTPUT_AUDIO_OFFSET_F - (peak >= LATE_ZONE_FROM ? LATE_ZONE_EXTRA_F : 0))),
  src, volume, dur,
});

export const SFX: Sfx[] = [
  at(30, 'swoosh-quick.mp3', 0.3), //                             la tarjeta se levanta (tilt-reveal, tramo más rápido)
  at(EV.genClick, 'click-camera.mp3', 0.5), //                    clic en "Generar cuadrante"
  at(EV.genPull + 8, 'swoosh-quick.mp3', 0.3), //                 la cámara se aleja al plano general
  at(EV.genReveal + 26, 'shimmer-sparkle-sweep.mp3', 0.26, 60), // el barrido escribe la semana
  at(EV.bajaPatch + 3, 'hit-weak.mp3', 0.4), //                   las celdas de Marta pasan a IT
  at(EV.opciones + 10, 'swoosh-quick.mp3', 0.3), //               se despliega el panel y la cámara baja
  at(EV.elegida, 'switch-tap.mp3', 0.4), //                       la responsable marca a Lucía
  at(SHOTS.publicar.from + 1, 'transition-soft.mp3', 0.28), //    corte al diálogo de publicar
  at(EV.pubClick, 'click-camera.mp3', 0.5), //                    clic en "Sí, publicar y avisar a 10"
  at(EV.cardOut + 10, 'air-woosh-quick.mp3', 0.28), //            sale la pantalla
  at(EV.chipL + 5, 'pop.mp3', 0.32), //                           chip "Aviso por correo"
  at(EV.chipR + 5, 'pop.mp3', 0.28), //                           chip "Su semana, en el móvil"
  at(EV.odo + ODO_LOCKS[0], 'lock-quick.mp3', 0.28), //           clac dígito 3
  at(EV.odo + ODO_LOCKS[1], 'lock-quick.mp3', 0.24), //           clac dígito 0
  at(EV.odo + ODO_LOCKS[1], 'bass-hit-short.mp3', 0.34), //       cifra confirmada (+30 h)
  at(EV.outroIn + 10, 'transition-soft.mp3', 0.26), //            entra el cierre de marca
  at(EV.outroIn + 60, 'sparkle-touch.mp3', 0.28), //              CTA "Solicita una auditoría"
];
