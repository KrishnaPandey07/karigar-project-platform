/**
 * Acoustic Audio Synthesis Engine for Karigar Platform
 * Built purely with Web Audio API — zero external audio files, zero network delay.
 * Generates warm, auspicious Indian temple bell, chime, and acoustic feedback tones.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Synthesize a resonant bell / chime note with natural harmonic decay
 */
function playChimeNote(freq, startTime, duration = 1.2, gainPeak = 0.25) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = startTime || ctx.currentTime;

  // Primary tone (sine)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, now);

  // Upper overtone (slight harmonic resonance like an Indian brass bell / ghanta)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2.76, now); // Bell harmonic ratio

  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.exponentialRampToValueAtTime(gainPeak, now + 0.04);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  gain2.gain.setValueAtTime(0.001, now);
  gain2.gain.exponentialRampToValueAtTime(gainPeak * 0.35, now + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.6);

  osc1.connect(gain1);
  osc2.connect(gain2);
  gain1.connect(ctx.destination);
  gain2.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
}

/**
 * 1. Auspicious Celebration & Welcome Chime (Pentatonic Indian Melodic Sequence)
 * Used when an artisan registers or when a job is successfully completed.
 */
export function playWelcomeSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Indian pentatonic notes (Sa, Re, Ga, Pa, Dha ~ C5, D5, E5, G5, A5, C6)
    const notes = [
      { freq: 523.25, time: 0.0 },  // C5 (Sa)
      { freq: 659.25, time: 0.14 }, // E5 (Ga)
      { freq: 783.99, time: 0.28 }, // G5 (Pa)
      { freq: 880.00, time: 0.44 }, // A5 (Dha)
      { freq: 1046.50, time: 0.62, dur: 2.0, peak: 0.35 }, // High C6 (Taar Sa)
    ];

    notes.forEach((n) => {
      playChimeNote(n.freq, now + n.time, n.dur || 1.4, n.peak || 0.25);
    });
  } catch (err) {
    console.debug('Audio effect silenced:', err);
  }
}

/**
 * 2. Duty Status Switch Sound
 * Distinctive acoustic feedback for switching between AVAILABLE, BUSY, and OFF_DUTY
 */
export function playDutySwitchSound(dutyStatus) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (dutyStatus === 'AVAILABLE') {
      // Bright, welcoming ascending dual-chime: Ready for work!
      playChimeNote(587.33, now, 0.7, 0.25); // D5
      playChimeNote(880.00, now + 0.12, 1.2, 0.3); // A5
    } else if (dutyStatus === 'BUSY') {
      // Grounding, focused dual-tone: Currently on a job
      playChimeNote(659.25, now, 0.6, 0.22); // E5
      playChimeNote(523.25, now + 0.14, 0.9, 0.25); // C5
    } else {
      // OFF_DUTY: Soothing, restful descending chord: Work finished, peaceful rest
      playChimeNote(783.99, now, 0.7, 0.2); // G5
      playChimeNote(659.25, now + 0.15, 0.8, 0.18); // E5
      playChimeNote(523.25, now + 0.32, 1.5, 0.25); // C5
    }
  } catch (err) {
    console.debug('Audio effect silenced:', err);
  }
}

/**
 * 3. Star Rating Harp Pluck (Interactive 1-5 feedback)
 */
export function playStarSelectSound(starLevel = 5) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Pitch scales with stars: 1 = C5, 2 = D5, 3 = E5, 4 = G5, 5 = High C6
    const pitches = [523.25, 587.33, 659.25, 783.99, 1046.50];
    const freq = pitches[Math.max(0, Math.min(starLevel - 1, 4))];

    playChimeNote(freq, now, 0.9, 0.22);
  } catch (err) {
    console.debug('Audio effect silenced:', err);
  }
}

/**
 * 4. Feedback & Appreciation Submitted Sound
 * Warm, grateful chime chord honoring the artisan's craft
 */
export function playFeedbackSuccessSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    playChimeNote(659.25, now, 1.0, 0.2); // E5
    playChimeNote(783.99, now + 0.1, 1.2, 0.25); // G5
    playChimeNote(1046.50, now + 0.22, 1.8, 0.32); // C6
  } catch (err) {
    console.debug('Audio effect silenced:', err);
  }
}
