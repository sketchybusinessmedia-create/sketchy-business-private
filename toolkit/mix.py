"""mix.py OUT_DIR VO_WAV OUT_MP4 - voice + synthesised sfx + original lo-fi music (ducked under the voice) onto frames.mp4."""
import sys, os, json, subprocess, numpy as np, soundfile as sf
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
import sfx as S
out_dir, vo_path, out_mp4 = sys.argv[1:4]
spec = json.load(open(os.path.join(out_dir, 'sfx.json'))); total = spec['total']
make = {'pop': S.sfx_pop, 'whoosh': S.sfx_whoosh, 'ding': S.sfx_ding, 'tick': S.sfx_tick, 'thud': S.sfx_thud, 'scribble': S.sfx_scribble}
fx = S.mix_sfx([(max(0, t), make[ty](), g) for t, ty, g in spec['events'] if ty in make], total)
fx = fx / max(1e-6, np.abs(fx).max()) * 0.5
vo, sr = sf.read(vo_path)
if vo.ndim > 1: vo = vo.mean(1)
if sr != S.SR:
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', vo_path, '-ac', '1', '-ar', str(S.SR), os.path.join(out_dir, 'vo48.wav')], check=True)
    vo, _ = sf.read(os.path.join(out_dir, 'vo48.wav'))
n = max(len(vo), len(fx)); vo = np.pad(vo, (0, n - len(vo))); fx = np.pad(fx, (0, n - len(fx)))
sf.write(os.path.join(out_dir, 'vofx.wav'), np.clip(vo + 0.4 * fx, -1, 1), S.SR)
subprocess.run([sys.executable, os.path.join(here, 'music.py'), os.path.join(out_dir, 'music.wav'), str(total + 0.1)], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(out_dir, 'vofx.wav'), '-i', os.path.join(out_dir, 'music.wav'), '-filter_complex',
                '[1:a]volume=0.22[m];[0:a]asplit=2[v][sc];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[md];'
                '[v]aformat=channel_layouts=stereo[vs];[vs][md]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1[a]',
                '-map', '[a]', '-ar', '48000', os.path.join(out_dir, 'final_mix.wav')], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(out_dir, 'frames.mp4'), '-i', os.path.join(out_dir, 'final_mix.wav'),
                '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out_mp4], check=True)
print('VIDEO_OK', out_mp4)
