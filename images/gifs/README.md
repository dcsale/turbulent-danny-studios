# Animated GIFs / WebM clips

Short looping clips for social media and devlog content.

Recommended:
- 3-10 second loops
- 720p or 1080p
- Under 5 MB file size for social platforms
- WebM (`.webm`) preferred over GIF for quality + file size; APNG (`.apng`) as fallback
- Show one specific feature or moment

These clips can be sourced from:
- The WarCritters `devlog.rs` recorder (Shift+F11 starts, F11 stops; frames land in `recordings/`)
- The Rad Winds `devlog_capture.rs` plugin (F11 frame recording → ffmpeg conversion)
- ParaView/VisIt rendering of canonical validation cases (per the Physics Testbed abstracts plan)

## Converting a PNG frame recording to WebM

```bash
# Replace 24 with the rate measured below.
ffmpeg -framerate 24 -i frame_%05d.png -vf "scale=1280:-2:flags=lanczos" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -pix_fmt yuv420p -an clip.webm
```

What the plain `ffmpeg -framerate 30 -i frame_%05d.png -c:v libvpx-vp9 -b:v 2M`
gets wrong, each checked on real WarCritters recordings:

1. **The frame rate is not 30.** The WarCritters recorder (`src/plugins/devlog.rs`,
   Shift+F11 to start, F11 to stop) aims for 30 fps, but after each capture it
   waits a full 1/30 s and then takes the next frame the game renders, so every
   gap runs a little long. Recordings land at about 22-24 fps (21.8-24.2 for the
   clips on this site), and encoding them at 30 plays the footage 24-38% too fast.
   Measure the real rate from the frame files' timestamps and pass that to
   `-framerate`:

   ```bash
   python -c "import glob,os; f=sorted(glob.glob('frame_*.png')); print(round((len(f)-1)/(os.path.getmtime(f[-1])-os.path.getmtime(f[0])),2))"
   ```

2. **It picks an unusual colour format.** From PNG frames, ffmpeg defaults to VP9
   Profile 1 (full-colour 4:4:4 RGB). The standard web format is Profile 0,
   which `-pix_fmt yuv420p` selects, and it is the one to use for broad browser and
   phone playback.

3. **It keeps full capture size.** The game window is resizable, so captures are
   often 2700-3800 px wide at odd sizes. `scale=1280:-2` brings them to web size and
   keeps the aspect ratio, rounding the height to an even number.

`-crf 34 -b:v 0` is constant quality, which keeps mostly-static arena footage
small: the WarCritters clips here are 1280 px wide and 0.8-3.7 MB. To cut a
section, add `-start_number <first frame>` before `-i` and `-frames:v <count>`
after it.

If the window was resized while recording, the frames change shape partway
through. ffmpeg keeps going but squeezes every later frame into the first frame's
shape; in one WarCritters recording the last frames came out 52% too wide.
Letterbox them into one fixed size instead:
`-vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2"`.
