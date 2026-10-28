"""cbx_voice.py SEGMENTS_JSON REF_WAV OUT_WAV TIMINGS_JSON
Voice = Aaron's own voice cloned with Chatterbox (lively: exaggeration 0.7, cfg 0.4). Speed values in SEGMENTS_JSON are ignored."""
import json, sys, re, subprocess, numpy as np, torch, torchaudio as ta
from chatterbox.tts import ChatterboxTTS
segs, ref, out_wav, tj = json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3], sys.argv[4]
torch.manual_seed(7)
m = ChatterboxTTS.from_pretrained(device="cpu"); SR = m.sr
audio, t, tim = [], 0.0, []
for key, text, *_ in segs:
    w = m.generate(text, audio_prompt_path=ref, exaggeration=0.7, cfg_weight=0.4).squeeze(0).numpy()
    idx = np.where(np.abs(w) > 0.01)[0]; w = w[max(0, idx[0]-int(.03*SR)):idx[-1]+int(.08*SR)]
    gap = 0.32
    tim.append([key, round(t, 3), round(t + len(w)/SR + gap, 3)])
    audio += [w, np.zeros(int(SR*gap), dtype=np.float32)]; t += len(w)/SR + gap
    print(key, round(len(w)/SR, 1), flush=True)
audio.append(np.zeros(int(SR*1.2), dtype=np.float32)); t += 1.2; tim[-1][2] = round(t, 3)
ta.save("/tmp/raw_vo.wav", torch.tensor(np.concatenate(audio)).unsqueeze(0), SR)
P = "highpass=f=80,equalizer=f=3000:t=q:w=1:g=2,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,loudnorm=I=-14:TP=-1"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "/tmp/raw_vo.wav", "-af", P, "-ar", "48000", out_wav], check=True)
json.dump(tim, open(tj, "w"), indent=1); print("total", round(t, 1), "s")
