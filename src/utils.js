export function humanTime(seconds) {
  if (!isFinite(seconds)) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export function bytesHuman(n) {
  if (n < 1024) return n + ' B';
  const u = ['KB', 'MB', 'GB'];
  let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  return n.toFixed(n < 10 ? 2 : 1) + ' ' + u[i];
}

export function suggestOutName(a, b) {
  function base(n) { return (n || 'track').replace(/\.[^.]+$/, ''); }
  return `${base(a)}__AVERAGE__${base(b)}.wav`;
}

export function audioBufferToWav(buffer) {
  // 16-bit PCM WAV
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;

  // Interleave
  const channelData = [];
  for (let ch = 0; ch < numChannels; ch++) channelData.push(buffer.getChannelData(ch));

  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const bufferSize = 44 + dataSize; // WAV header is 44 bytes
  const ab = new ArrayBuffer(bufferSize);
  const dv = new DataView(ab);

  function writeStr(offset, str) { for (let i = 0; i < str.length; i++) dv.setUint8(offset + i, str.charCodeAt(i)); }

  writeStr(0, 'RIFF');
  dv.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');

  writeStr(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, numChannels, true);
  dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * blockAlign, true);
  dv.setUint16(32, blockAlign, true);
  dv.setUint16(34, 16, true);

  writeStr(36, 'data');
  dv.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = clamp(channelData[ch][i], -1, 1);
      const s = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      dv.setInt16(offset, s, true);
      offset += 2;
    }
  }

  return new Blob([ab], { type: 'audio/wav' });
}
