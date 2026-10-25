"""Tiempos de palabra sintéticos (2,7 palabras/s, pausas en puntos) para previsualizar la plantilla sin grabación."""
import json, re, sys
TXT = """Una inteligencia artificial acaba de encontrar un fallo en el sistema con el que funcionan casi ocho de cada diez webs del mundo.
Se llama PHP. Tiendas online, webs de reservas… y probablemente la web de tu empresa.
Una empresa de ciberseguridad usó una IA de OpenAI para buscar fallos y encontró dos críticos. Con ellos, alguien puede tomar el control de tu servidor sin necesitar ninguna contraseña.
El día 21 PHP sacó parches de urgencia. Pero en menos de un día, los intentos de ataque pasaron de decenas de miles a millones. Estados Unidos y Reino Unido ya han pedido actualizar… o desconectar.
El problema es que muchas webs de empresa las hizo una agencia hace años: funcionan, nadie las toca y nadie sabe quién tiene que actualizarlas.
Así que haz esto hoy: escríbele a quien te lleva la web y pregúntale si ya ha aplicado los parches de PHP de esta semana.
Y si quieres saber si tu web está en riesgo, comenta WEB y te paso las cinco comprobaciones que hacemos en KAIRO."""
t = 0.3; out = []
for tok in TXT.split():
    d = 0.11 + 0.034 * len(re.sub(r'\W', '', tok))
    out.append({"w": tok, "s": round(t, 3), "e": round(t + d, 3)})
    t += d + 0.03
    if re.search(r'[.:…]$', tok): t += 0.3
    elif tok.endswith(','): t += 0.15
json.dump(out, open(sys.argv[1], 'w'), ensure_ascii=False)
print(len(out), round(t, 1))
