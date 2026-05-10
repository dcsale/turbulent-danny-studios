# Animated GIFs / WebM clips

Short looping clips for social media and devlog content.

Recommended:
- 3-10 second loops
- 720p or 1080p
- Under 5 MB file size for social platforms
- WebM (`.webm`) preferred over GIF for quality + file size; APNG (`.apng`) as fallback
- Show one specific feature or moment

These clips can be sourced from:
- The CoBlade-Game `devlog_capture.rs` plugin (F11 frame recording → ffmpeg conversion)
- ParaView/VisIt rendering of canonical validation cases (per the Physics Testbed abstracts plan)

```bash
# Convert PNG sequence to WebM
ffmpeg -framerate 30 -i frame_%05d.png -c:v libvpx-vp9 -b:v 2M hero.webm
```
