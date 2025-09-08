export const TARGET_SAMPLE_RATE = 44100; // Common denominator; browsers will resample if needed

export function humanTime(seconds) {
  if (!isFinite(seconds)) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export function bytesHuman(n){
  if (n < 1024) return n + ' B';
  const u = ['KB','MB','GB']; let i = -1; do { n/=1024; i++; } while (n>=1024 && i<u.length-1);
  return n.toFixed(n<10?2:1)+' '+u[i];
}
