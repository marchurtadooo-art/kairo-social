// Animaciones de cada escena del vídeo hablado (una por idea). Todas se dibujan dentro de `box` y usan el frame local `f`.
import React from 'react';
import { E, lerp, seg } from '../lib/m';
import { K } from '../theme';
import { C, Card, Chip, Icon, KMark, Mono, Stamp, Tile, enter, pop, GfxProps, Stage } from './kit';


// ── 8 de cada 10 webs funcionan con PHP
const Browser: React.FC<{ php: boolean; on: number; w: number }> = ({ php, on, w }) => (
  <div style={{ width: w, height: w * 0.78, borderRadius: 16, background: C.card, border: `1.5px solid ${php && on > 0 ? `rgba(110,124,255,${0.4 + 0.5 * on})` : C.line}`, position: 'relative', overflow: 'hidden', boxShadow: php && on > 0 ? `0 0 ${30 * on}px rgba(75,92,240,${0.4 * on})` : undefined }}>
    <div style={{ display: 'flex', gap: 6, padding: '10px 12px' }}>{[0, 1, 2].map((i) => <i key={i} style={{ width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.18)' }} />)}</div>
    <div style={{ margin: '4px 14px', height: 12, borderRadius: 6, background: 'rgba(255,255,255,.12)', width: '60%' }} />
    <div style={{ margin: '10px 14px', height: 8, borderRadius: 4, background: 'rgba(255,255,255,.07)', width: '80%' }} />
    <div style={{ margin: '0 14px', height: 8, borderRadius: 4, background: 'rgba(255,255,255,.07)', width: '50%' }} />
    {php ? (
      <div style={{ position: 'absolute', right: 10, bottom: 10, fontFamily: K.mono, fontSize: 18, fontWeight: 500, color: '#fff', background: C.electric, borderRadius: 8, padding: '3px 9px', opacity: on, transform: `scale(${lerp(on, 0.5, 1)})` }}>PHP</div>
    ) : null}
  </div>
);

export const WebGrid: React.FC<GfxProps> = ({ f, box, props, eyebrow }) => {
  if (props?.labels) {
    const items: [string, 'cart' | 'calendar' | 'building', string][] = [['Tiendas online', 'cart', 'tienda'], ['Webs de reservas', 'calendar', 'reservas'], ['La web de tu empresa', 'building', 'tu']];
    return (
      <Stage f={f} box={box} eyebrow={eyebrow}>
        {items.map(([label, icon, k], i) => {
          const at = 4 + i * 9;
          const mine = k === 'tu';
          return (
            <div key={k} style={{ ...enter(f, at), width: 820 }}>
              <Card glow={mine ? seg(f, at + 6, at + 16) : 0} style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '26px 30px' }}>
                <Tile size={78} glow={mine ? 1 : 0.35}><Icon name={icon} size={38} color={mine ? C.soft : C.text} /></Tile>
                <div style={{ fontFamily: K.sans, fontWeight: 600, fontSize: 40, color: C.text, flex: 1 }}>{label}</div>
                <div style={pop(f, at + 6)}><Chip>PHP</Chip></div>
              </Card>
            </div>
          );
        })}
      </Stage>
    );
  }
  const W = 160, G = 26;
  const order = [0, 6, 3, 8, 1, 9, 4, 7]; // las 8 que se encienden (las otras dos, 2 y 5, se quedan apagadas)
  const lit = order.filter((_, i) => f >= 14 + i * 3).length;
  return (
    <Stage f={f} box={box} eyebrow={eyebrow}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(5, ${W}px)`, gap: G }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const k = order.indexOf(i);
          const on = k >= 0 ? seg(f, 14 + k * 3, 20 + k * 3, E.outCubic) : 0;
          return <div key={i} style={enter(f, i * 1.5, 9)}><Browser php={k >= 0} on={on} w={W} /></div>;
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 22, ...enter(f, 12) }}>
        <span style={{ fontFamily: K.sans, fontWeight: 700, fontSize: 150, letterSpacing: '-0.05em', color: C.text, fontVariantNumeric: 'tabular-nums' }}>{lit}</span>
        <span style={{ fontFamily: K.sans, fontWeight: 600, fontSize: 56, color: C.dim }}>/ 10</span>
        <span style={{ fontFamily: K.sans, fontWeight: 500, fontSize: 34, color: C.mist, maxWidth: 300, lineHeight: 1.15 }}>webs funcionan con PHP</span>
      </div>
    </Stage>
  );
};

// ── Una IA escanea el código y marca dos fallos críticos
export const CodeScan: React.FC<GfxProps> = ({ f, box, eyebrow }) => {
  const lines = [0.62, 0.48, 0.74, 0.35, 0.68, 0.52, 0.8, 0.44, 0.58, 0.7];
  const bad = [3, 7];
  const scanY = lerp(seg(f, 8, 50, E.inOutQuad), 0, lines.length);
  return (
    <Stage f={f} box={box} eyebrow={eyebrow}>
      <div style={enter(f, 0)}>
        <Card style={{ width: 900, padding: '22px 0 26px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px 18px', borderBottom: `1.5px solid ${C.line}` }}>
            <Icon name="code" size={30} color={C.soft} />
            <Mono size={22} color={C.text}>php-src · análisis</Mono>
            <span style={{ flex: 1 }} />
            <Chip style={{ opacity: 0.6 + 0.4 * Math.abs(Math.sin(f / 6)) }}><Icon name="spark" size={20} color={C.soft} stroke={2.2} />IA</Chip>
          </div>
          <div style={{ position: 'relative', padding: '16px 28px 0' }}>
            {lines.map((w, i) => {
              const hit = bad.includes(i) && scanY > i + 0.5;
              const hp = hit ? seg(f, 8 + (i + 0.5) * (42 / lines.length), 14 + (i + 0.5) * (42 / lines.length)) : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, height: 34, background: hp > 0 ? `rgba(255,92,108,${0.16 * hp})` : undefined, margin: '0 -28px', padding: '0 28px' }}>
                  <Mono size={18} color={C.dim} style={{ width: 30, textAlign: 'right' }}>{i + 1}</Mono>
                  <div style={{ height: 10, borderRadius: 5, width: `${w * 70}%`, background: hp > 0 ? C.bad : 'rgba(255,255,255,.14)' }} />
                  {hp > 0 ? <span style={{ marginLeft: 'auto', ...pop(f, 9 + (i + 0.5) * (42 / lines.length)) }}><Chip tone="bad">Crítico</Chip></span> : null}
                </div>
              );
            })}
            {f >= 8 && f <= 52 ? (
              <div style={{ position: 'absolute', left: 0, right: 0, top: 16 + scanY * 34, height: 3, background: `linear-gradient(90deg, transparent, ${C.soft}, transparent)`, boxShadow: `0 0 24px ${C.electric}` }} />
            ) : null}
          </div>
        </Card>
      </div>
      <div style={{ display: 'flex', gap: 16, ...enter(f, 50) }}>
        <Chip tone="dim">Encontrado por una IA de OpenAI</Chip>
        <Chip tone="bad">2 fallos críticos</Chip>
      </div>
    </Stage>
  );
};

// ── Tomar el control sin contraseña
export const LockServer: React.FC<GfxProps> = ({ f, box, eyebrow }) => {
  const open = seg(f, 26, 34, E.outCubic);
  const strike = seg(f, 18, 26, E.outCubic);
  return (
    <Stage f={f} box={box} eyebrow={eyebrow}>
      <div style={{ ...pop(f, 2), position: 'relative' }}>
        <Tile size={170} glow={1 - open * 0.6} style={{ borderColor: open > 0 ? `rgba(255,92,108,${0.4 + 0.5 * open})` : undefined, boxShadow: `0 0 ${70}px rgba(${open > 0 ? '255,92,108' : '75,92,240'},.45)` }}>
          <Icon name={open > 0.5 ? 'unlock' : 'lock'} size={92} color={open > 0 ? C.bad : C.soft} stroke={1.6} style={{ transform: `translateY(${-6 * open}px)` }} />
        </Tile>
      </div>
      <div style={enter(f, 8)}>
        <Card style={{ width: 760, padding: '26px 30px', display: 'grid', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><Icon name="server" size={34} color={C.mist} /><span style={{ fontFamily: K.sans, fontWeight: 600, fontSize: 34, color: C.text }}>Tu servidor</span></div>
          <Mono size={20} color={C.dim}>CONTRASEÑA</Mono>
          <div style={{ position: 'relative', height: 70, borderRadius: 16, background: C.card2, border: `1.5px solid ${C.line2}`, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
            <span style={{ fontFamily: K.mono, fontSize: 40, letterSpacing: '.3em', color: C.mist }}>••••••••••</span>
            <div style={{ position: 'absolute', left: 20, top: '50%', height: 4, borderRadius: 2, width: `${strike * 64}%`, background: C.bad }} />
            {strike > 0.9 ? <span style={{ marginLeft: 'auto', ...pop(f, 25) }}><Chip tone="bad">No hace falta</Chip></span> : null}
          </div>
        </Card>
      </div>
      <div style={enter(f, 34)}><Chip tone="bad">Control total del servidor</Chip></div>
    </Stage>
  );
};

// ── Parche de urgencia (21 oct)
export const PatchCard: React.FC<GfxProps> = ({ f, box, eyebrow }) => {
  const p = seg(f, 10, 48, E.inOutQuad);
  const done = p >= 1;
  return (
    <Stage f={f} box={box} eyebrow={eyebrow}>
      <div style={enter(f, 0)}>
        <Card glow={done ? 1 : 0.4} style={{ width: 820, padding: '34px 36px', display: 'grid', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <Tile size={86}><Icon name="shield" size={44} color={C.soft} /></Tile>
            <div style={{ display: 'grid', gap: 4, flex: 1 }}>
              <span style={{ fontFamily: K.sans, fontWeight: 600, fontSize: 40, color: C.text }}>Parche de seguridad</span>
              <Mono size={21} color={C.mist}>PHP 8.5.12 · 8.4.27 · 8.3.36 · 8.2.35</Mono>
            </div>
            <Chip>21 oct</Chip>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {done ? <span style={{ display: 'inline-flex', ...pop(f, 48) }}><Icon name="check" size={30} color={C.good} stroke={2.6} /></span> : null}
            <Mono size={22} color={done ? C.good : C.mist}>{done ? 'INSTALADO' : 'INSTALANDO…'}</Mono>
            <span style={{ flex: 1 }} />
            <Mono size={22} color={C.text} style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(p * 100)} %</Mono>
          </div>
          <div style={{ height: 14, borderRadius: 7, background: C.card2 }}>
            <div style={{ height: '100%', width: `${p * 100}%`, borderRadius: 7, background: done ? C.good : C.electric, boxShadow: `0 0 20px ${done ? C.good : C.electric}` }} />
          </div>
        </Card>
      </div>
    </Stage>
  );
};

// ── De decenas de miles a millones de intentos de ataque en menos de un día
export const Counter: React.FC<GfxProps> = ({ f, box, eyebrow }) => {
  const p = seg(f, 8, 46, (u) => u * u * (3 - 2 * u));
  const v = Math.round(Math.pow(10, 4 + 2 * p) / 1000) * 1000;
  const txt = v.toLocaleString('es-ES');
  const hit = f >= 46;
  return (
    <Stage f={f} box={box} eyebrow={eyebrow}>
      <div style={{ display: 'flex', gap: 60, alignItems: 'flex-end', height: 420, ...enter(f, 0) }}>
        {[['Antes', 0.12, 'decenas de miles'], ['Menos de 24 h después', 1, 'millones']].map(([l, hgt, sub], i) => {
          const g = i === 0 ? seg(f, 2, 12, E.outCubic) : seg(f, 8, 46, (u) => u * u);
          return (
            <div key={i} style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
              <div style={{ width: 200, height: Math.max(12, 360 * (hgt as number) * g), borderRadius: 18, background: i === 0 ? 'rgba(255,255,255,.16)' : `linear-gradient(180deg, ${C.bad}, #b8293a)`, boxShadow: i === 1 ? `0 0 ${40 * g}px rgba(255,92,108,.45)` : undefined }} />
              <Mono size={20} color={C.mist}>{(l as string).toUpperCase()}</Mono>
              <span style={{ fontFamily: K.sans, fontWeight: 600, fontSize: 30, color: i === 1 ? C.bad : C.mist }}>{sub as string}</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: K.sans, fontWeight: 700, fontSize: 132, letterSpacing: '-0.04em', color: hit ? C.bad : C.text, fontVariantNumeric: 'tabular-nums', transform: `scale(${hit ? 1 + 0.08 * Math.sin(Math.PI * seg(f, 46, 56)) : 1})`, ...{ opacity: seg(f, 4, 10) } }}>
        {txt}{hit ? '+' : ''}
      </div>
      <Mono size={20} color={C.dim}>INTENTOS DE ATAQUE · DATOS DE CLOUDFLARE</Mono>
    </Stage>
  );
};

// ── EE. UU. y Reino Unido: actualizar o desconectar
export const AlertCards: React.FC<GfxProps> = ({ f, box, eyebrow }) => (
  <Stage f={f} box={box} eyebrow={eyebrow}>
    {[['Estados Unidos', 0, 'Parchear ya… o desconectar'], ['Reino Unido', 10, 'Actualizar sin esperar']].map(([who, at, msg]) => (
      <div key={who as string} style={{ ...enter(f, at as number), transform: `${enter(f, at as number).transform} translateX(${lerp(seg(f, at as number, (at as number) + 12, E.cam), 120, 0)}px)` }}>
        <Card style={{ width: 820, padding: '28px 32px', display: 'flex', gap: 24, alignItems: 'center', borderColor: 'rgba(242,184,79,.45)' }}>
          <Tile size={86} glow={0} style={{ borderColor: 'rgba(242,184,79,.6)', boxShadow: '0 0 40px rgba(242,184,79,.3)' }}><Icon name="alert" size={44} color={C.warn} /></Tile>
          <div style={{ display: 'grid', gap: 6 }}>
            <Mono size={20} color={C.warn}>AGENCIA DE CIBERSEGURIDAD · {(who as string).toUpperCase()}</Mono>
            <span style={{ fontFamily: K.sans, fontWeight: 600, fontSize: 40, color: C.text }}>{msg as string}</span>
          </div>
        </Card>
      </div>
    ))}
    <div style={{ position: 'relative', height: 90, width: 820 }}>
      <Stamp f={f} at={24} text="URGENTE" tone="warn" rot={-5} style={{ right: 40, top: 0 }} />
    </div>
  </Stage>
);

// ── La web que hizo una agencia hace años y nadie mantiene
export const OldSite: React.FC<GfxProps> = ({ f, box, eyebrow }) => (
  <Stage f={f} box={box} eyebrow={eyebrow}>
    <div style={{ ...enter(f, 0), position: 'relative' }}>
      <Card style={{ width: 820, overflow: 'hidden', filter: 'saturate(.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1.5px solid ${C.line}` }}>
          {[0, 1, 2].map((i) => <i key={i} style={{ width: 11, height: 11, borderRadius: 6, background: 'rgba(255,255,255,.18)' }} />)}
          <div style={{ marginLeft: 12, flex: 1, height: 34, borderRadius: 10, background: C.card2, display: 'flex', alignItems: 'center', padding: '0 14px' }}><Mono size={20} color={C.mist}>tuempresa.es</Mono></div>
        </div>
        <div style={{ padding: '26px 30px', display: 'grid', gap: 14 }}>
          <div style={{ height: 120, borderRadius: 14, background: 'rgba(255,255,255,.06)' }} />
          {[
            ['Hecha por', 'una agencia', 8],
            ['Año', '2021', 14],
            ['Última actualización', '¿?', 20],
            ['Quién la mantiene', '¿?', 26],
          ].map(([k, v, at]) => (
            <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...enter(f, at as number, 8) }}>
              <Mono size={21} color={C.dim}>{(k as string).toUpperCase()}</Mono>
              <span style={{ fontFamily: K.sans, fontWeight: 600, fontSize: 32, color: (v as string).includes('?') ? C.bad : C.text }}>{v as string}</span>
            </div>
          ))}
        </div>
      </Card>
      <Stamp f={f} at={34} text="SIN MANTENER" tone="bad" rot={-7} style={{ right: -10, top: 70 }} />
    </div>
  </Stage>
);

// ── Mensaje a quien te lleva la web
export const ChatCompose: React.FC<GfxProps> = ({ f, box, eyebrow }) => {
  const msg = 'Hola, ¿habéis aplicado ya los parches de PHP de esta semana?';
  const n = Math.min(msg.length, Math.max(0, Math.floor((f - 10) * 1.25)));
  const typed = n >= msg.length;
  const sendAt = 10 + Math.ceil(msg.length / 1.25) + 6;
  const sent = f >= sendAt + 4;
  return (
    <Stage f={f} box={box} eyebrow={eyebrow}>
      <div style={enter(f, 0)}>
        <Card style={{ width: 880, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px', borderBottom: `1.5px solid ${C.line}` }}>
            <Icon name="message" size={30} color={C.soft} /><span style={{ fontFamily: K.sans, fontWeight: 600, fontSize: 30, color: C.text }}>Nuevo mensaje</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', borderBottom: `1.5px solid ${C.line}` }}>
            <Mono size={20} color={C.dim}>PARA:</Mono>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.card2, borderRadius: 999, padding: '6px 14px' }}><Icon name="user" size={22} color={C.mist} /><span style={{ fontFamily: K.sans, fontSize: 24, color: C.text }}>Quien te lleva la web</span></span>
          </div>
          <div style={{ padding: '22px 24px', minHeight: 150, fontFamily: K.sans, fontSize: 36, lineHeight: 1.35, color: C.text }}>
            {msg.slice(0, n)}{!typed && Math.floor(f / 6) % 2 === 0 ? <span style={{ color: C.soft }}>|</span> : null}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, padding: '0 24px 22px' }}>
            {sent ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...pop(f, sendAt + 4) }}><Icon name="check" size={26} color={C.good} stroke={2.6} /><Mono size={20} color={C.good}>ENVIADO</Mono></span> : null}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: C.electric, color: '#fff', borderRadius: 999, padding: '12px 24px', fontFamily: K.sans, fontWeight: 600, fontSize: 26, transform: `scale(${f >= sendAt && f < sendAt + 4 ? 0.92 : 1})`, opacity: typed ? 1 : 0.5 }}>
              Enviar <Icon name="send" size={22} color="#fff" stroke={2.2} />
            </div>
          </div>
        </Card>
      </div>
    </Stage>
  );
};
export const chatSendAt = () => 10 + Math.ceil('Hola, ¿habéis aplicado ya los parches de PHP de esta semana?'.length / 1.25) + 6;

// ── Llamada a la acción: comenta la palabra clave
export const CtaKeyword: React.FC<GfxProps> = ({ f, box, props, eyebrow }) => {
  const kw = String(props?.keyword ?? 'WEB');
  const n = Math.min(kw.length, Math.max(0, Math.floor((f - 14) / 4)));
  const ok = n >= kw.length;
  const okAt = 14 + kw.length * 4 + 2;
  return (
    <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, display: 'grid', gap: 18 }}>
      <div style={enter(f, 6)}>
        <Card glow={ok ? 1 : 0.5} style={{ padding: '18px 22px', display: 'grid', gap: 10, background: 'rgba(17,19,31,.92)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="message" size={24} color={C.soft} /><Mono size={19} color={C.soft}>COMENTA LA PALABRA CLAVE</Mono>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: K.sans, fontWeight: 700, fontSize: 86, letterSpacing: '-0.02em', color: C.text, minWidth: 10 }}>{kw.slice(0, n)}</span>
            {!ok ? <span style={{ width: 8, height: 70, background: C.soft, opacity: Math.floor(f / 6) % 2 ? 1 : 0 }} /> : null}
            <span style={{ flex: 1 }} />
            {ok ? <span style={{ width: 62, height: 62, borderRadius: 31, background: C.electric, display: 'grid', placeItems: 'center', ...pop(f, okAt) }}><Icon name="check" size={34} color="#fff" stroke={2.8} /></span> : null}
          </div>
        </Card>
      </div>
      {f >= okAt + 10 ? (
        <div style={enter(f, okAt + 10)}>
          <Card style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(17,19,31,.92)' }}>
            <Tile size={60} glow={0.8}><KMark size={36} /></Tile>
            <div style={{ display: 'grid', gap: 2 }}>
              <Mono size={18} color={C.soft}>KAIRO AI TE RESPONDE</Mono>
              <span style={{ fontFamily: K.sans, fontWeight: 600, fontSize: 32, color: C.text }}>Las 5 comprobaciones para tu web</span>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};
export const ctaOkAt = (kw: string) => 14 + kw.length * 4 + 2;

export const GFX = { WebGrid, CodeScan, LockServer, PatchCard, Counter, AlertCards, OldSite, ChatCompose, CtaKeyword };
