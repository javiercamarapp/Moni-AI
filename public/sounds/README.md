# Sonidos de Moni Wise Coach

Esta carpeta contiene los archivos de audio para las notificaciones y animaciones de la aplicación.

## Archivo requerido

### levelup.mp3
**Descripción**: Sonido que se reproduce cuando un usuario sube de nivel.

**Características recomendadas**:
- Duración: 0.5-0.8 segundos
- Tono: Agudo y brillante (G5-C6)
- Sin reverb excesivo
- Formato: MP3, 44.1kHz
- Tamaño: ~40-50 KB

**Dónde conseguir sonidos similares**:
1. **Freesound.org** - Busca "achievement", "level up", "success ping"
2. **Zapsplat.com** - Sección "Game Sounds > UI > Achievement"
3. **Pixabay Audio** - Busca "notification success"
4. **Mixkit.co** - Sonidos UI gratuitos

## Cómo usar

1. Descarga un sonido de logro de uno de los sitios mencionados
2. Renómbralo a `levelup.mp3`
3. Colócalo en esta carpeta `/public/sounds/`
4. El sonido se reproducirá automáticamente cuando un usuario suba de nivel

## Nota

Si no se encuentra el archivo de audio, la aplicación seguirá funcionando normalmente sin reproducir sonido (fail silently).
