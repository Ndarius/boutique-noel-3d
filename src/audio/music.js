// Musique de Noël synthétisée en temps réel avec la Web Audio API.
// Mélodies du domaine public : « Jingle Bells » (1857) et « Douce Nuit » (1818).
// Aucun fichier audio à télécharger, aucun problème de droits.

const midi = (m) => 440 * 2 ** ((m - 69) / 12);
const N = { C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81 };
const CH = {
  C: [48, [0, 4, 7]], F: [53, [0, 4, 7]], G: [55, [0, 4, 7]], G7: [55, [0, 4, 10]],
  Am: [57, [0, 3, 7]], Dm: [50, [0, 3, 7]], D7: [50, [0, 4, 10]],
};

const seq = (str) =>
  str.trim().split(/\s+/).map((tok) => {
    const [n, d] = tok.split(':');
    return [n === 'r' ? null : N[n], parseFloat(d)];
  });

const JINGLE_VERSE = seq(`
  G4:1 E5:1 D5:1 C5:1  G4:3 G4:.5 G4:.5  G4:1 E5:1 D5:1 C5:1  A4:4
  A4:1 F5:1 E5:1 D5:1  B4:4  G5:1 G5:1 F5:1 D5:1  E5:4
  G4:1 E5:1 D5:1 C5:1  G4:4  G4:1 E5:1 D5:1 C5:1  A4:3 A4:1
  A4:1 F5:1 E5:1 D5:1  G5:1 G5:1 G5:1 G5:1  A5:1 G5:1 F5:1 D5:1  C5:2 G5:2`);
const JINGLE_CHORUS = seq(`
  E5:1 E5:1 E5:2  E5:1 E5:1 E5:2  E5:1 G5:1 C5:1.5 D5:.5  E5:4
  F5:1 F5:1 F5:1.5 F5:.5  F5:1 E5:1 E5:1 E5:.5 E5:.5  E5:1 D5:1 D5:1 E5:1  D5:2 G5:2
  E5:1 E5:1 E5:2  E5:1 E5:1 E5:2  E5:1 G5:1 C5:1.5 D5:.5  E5:4
  F5:1 F5:1 F5:1.5 F5:.5  F5:1 E5:1 E5:1 E5:.5 E5:.5  G5:1 G5:1 F5:1 D5:1  C5:4`);

const SILENT = seq(`
  G4:3 A4:1 G4:2  E4:6  G4:3 A4:1 G4:2  E4:6  D5:4 D5:2  B4:6  C5:4 C5:2  G4:6
  A4:4 A4:2  C5:3 B4:1 A4:2  G4:3 A4:1 G4:2  E4:6  A4:4 A4:2  C5:3 B4:1 A4:2  G4:3 A4:1 G4:2  E4:6
  D5:4 D5:2  F5:3 D5:1 B4:2  C5:6  E5:6  C5:3 G4:1 E4:2  G4:3 F4:1 D4:2  C4:6  r:6`);

const SONGS = [
  {
    title: 'Jingle Bells',
    unit: 0.4, // durée d'une noire (s)
    bar: 4,
    melody: [...JINGLE_VERSE, ...JINGLE_CHORUS],
    chords: 'C C C Am Dm G G7 C C C C Am Dm G7 G7 C C C C C F C D7 G C C C C F C G7 C'.split(' '),
    sleigh: true,
  },
  {
    title: 'Douce Nuit',
    unit: 0.3, // durée d'une croche (s)
    bar: 6,
    melody: SILENT,
    chords: 'C C C C G7 G7 C C F F C C F F C C G7 G7 C C C G7 C C'.split(' '),
    sleigh: false,
  },
];

export class ChristmasMusic {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.songIndex = 0;
    this.listeners = new Set();
  }

  onChange(fn) {
    this.listeners.add(fn);
  }

  emit() {
    this.listeners.forEach((fn) => fn(this.enabled));
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    this.dry = ctx.createGain();
    this.dry.gain.value = 0.8;
    this.dry.connect(this.master);
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(3.2);
    const wet = ctx.createGain();
    wet.gain.value = 0.45;
    this.reverb.connect(wet).connect(this.master);
    this.noise = this.noiseBuffer();
    this.newBus();
  }

  // Chaque session d'écoute passe par son propre bus : à l'arrêt on le coupe,
  // ce qui fait taire les notes déjà programmées.
  newBus() {
    if (this.busDry) {
      this.busDry.disconnect();
      this.busRev.disconnect();
    }
    this.busDry = this.ctx.createGain();
    this.busDry.connect(this.dry);
    this.busRev = this.ctx.createGain();
    this.busRev.connect(this.reverb);
  }

  impulse(seconds) {
    const { ctx } = this;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6;
    }
    return buf;
  }

  noiseBuffer() {
    const { ctx } = this;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  out(node, send = 0.5) {
    node.connect(this.busDry);
    const s = this.ctx.createGain();
    s.gain.value = send;
    node.connect(s).connect(this.busRev);
  }

  // Timbre de clochette / célesta
  bell(note, t, dur, vel = 0.22) {
    const { ctx } = this;
    const f = midi(note);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vel, t + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(1.2, dur * 2.2));
    this.out(env, 0.55);
    [[1, 1], [2, 0.35], [3.01, 0.12], [4.2, 0.05]].forEach(([mul, g]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * mul;
      const gg = ctx.createGain();
      gg.gain.value = g;
      o.connect(gg).connect(env);
      o.start(t);
      o.stop(t + Math.max(1.3, dur * 2.3));
    });
  }

  pad(chord, t, dur) {
    const { ctx } = this;
    const [root, ints] = CH[chord] || CH.C;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1100;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(0.045, t + 0.35);
    env.gain.setValueAtTime(0.045, t + dur - 0.1);
    env.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
    lp.connect(env);
    this.out(env, 0.7);
    ints.forEach((iv) => {
      [-4, 4].forEach((det) => {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = midi(root + 12 + iv);
        o.detune.value = det;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 0.7);
      });
    });
    // basse
    const b = ctx.createOscillator();
    b.type = 'sine';
    b.frequency.value = midi(root - 12);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur, 1.6));
    b.connect(bg);
    this.out(bg, 0.2);
    b.start(t);
    b.stop(t + dur + 0.1);
  }

  sleigh(t, vel = 0.05) {
    const { ctx } = this;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 7500;
    hp.Q.value = 1.2;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vel, t + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(hp).connect(env);
    this.out(env, 0.3);
    src.start(t, Math.random() * 0.5, 0.2);
  }

  // Petit « ding » quand on ajoute au panier
  ding() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime + 0.01;
    this.bell(N.C5 + 12, t, 0.3, 0.12);
    this.bell(N.G5 + 12, t + 0.09, 0.4, 0.1);
  }

  scheduleSong(start) {
    const song = SONGS[this.songIndex % SONGS.length];
    const u = song.unit;
    let t = start;
    for (const [note, d] of song.melody) {
      if (note) this.bell(note, t, d * u);
      t += d * u;
    }
    const total = t - start;
    song.chords.forEach((c, i) => this.pad(c, start + i * song.bar * u, song.bar * u));
    if (song.sleigh) {
      const steps = Math.floor(total / (u / 2));
      for (let i = 0; i < steps; i++) this.sleigh(start + i * (u / 2), i % 2 ? 0.025 : 0.06);
    }
    this.songIndex++;
    return total;
  }

  loop() {
    if (!this.enabled) return;
    const now = this.ctx.currentTime;
    if (this.nextStart - now < 1.0) {
      const dur = this.scheduleSong(this.nextStart);
      this.nextStart += dur + 2.5;
    }
    this.timer = setTimeout(() => this.loop(), 500);
  }

  start() {
    this.init();
    if (!this.ctx) return;
    this.ctx.resume();
    if (this.enabled) return;
    this.enabled = true;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.9, now + 1.2);
    if (!this.nextStart || this.nextStart < now) this.nextStart = now + 0.2;
    this.loop();
    this.emit();
  }

  stop() {
    if (!this.ctx || !this.enabled) return;
    this.enabled = false;
    clearTimeout(this.timer);
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.6);
    // Les notes déjà programmées s'éteignent avec le volume ; on repart sur un nouveau morceau.
    setTimeout(() => {
      if (!this.enabled) {
        this.newBus();
        this.nextStart = 0;
        this.ctx.suspend();
      }
    }, 700);
    this.emit();
  }

  toggle() {
    this.enabled ? this.stop() : this.start();
  }
}
