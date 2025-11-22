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

export function suggestOutName(...names) {
  function base(n) { return (n || 'track').replace(/\.[^.]+$/, ''); }
  const parts = names.filter(Boolean).map(base);
  return `${(parts.length ? parts : ['track']).join('__AVERAGE__')}.wav`;
}

export function stretchChannelData(data, targetLength) {
  if (targetLength < 1) throw new Error('Target length must be at least 1 sample');
  const sourceLength = data.length;
  if (sourceLength === 0) throw new Error('Cannot stretch empty channel data');
  if (targetLength === sourceLength) return new Float32Array(data);
  if (sourceLength === 1) return new Float32Array(targetLength).fill(data[0]);
  if (targetLength === 1) return new Float32Array([data[0]]);

  const out = new Float32Array(targetLength);
  const scale = (sourceLength - 1) / (targetLength - 1);
  for (let i = 0; i < targetLength; i++) {
    const pos = i * scale;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const nextIdx = Math.min(sourceLength - 1, idx + 1);
    out[i] = data[idx] * (1 - frac) + data[nextIdx] * frac;
  }
  return out;
}

export function stretchBuffer(buffer, targetLength, createBuffer) {
  const maker = createBuffer || ((opts) => {
    if (typeof AudioBuffer === 'undefined') throw new Error('AudioBuffer is not available');
    return new AudioBuffer(opts);
  });
  const { numberOfChannels, sampleRate } = buffer;
  const out = maker({ length: targetLength, numberOfChannels, sampleRate });
  for (let ch = 0; ch < numberOfChannels; ch++) {
    const stretched = stretchChannelData(buffer.getChannelData(ch), targetLength);
    out.getChannelData(ch).set(stretched);
  }
  return out;
}

export function bufferStrength(buffer, length) {
  const len = Math.min(buffer.length, length ?? buffer.length);
  if (!Number.isFinite(len) || len < 1) throw new Error('Strength length must be at least 1 sample');
  let sum = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < len; i++) sum += Math.abs(data[i]);
  }
  return sum / (len * buffer.numberOfChannels);
}

export function getChannelOrFallback(buf, ch) {
  const n = buf.numberOfChannels;
  if (n < 1) throw new Error('Buffer has no channels');
  if (ch < n) return buf.getChannelData(ch);
  return buf.getChannelData(Math.min(ch, n - 1));
}

export function normalizeBuffers(buffers, length) {
  const len = length ?? Math.min(...buffers.map(b => b.length));
  const sums = buffers.map(buf => {
    let sum = 0;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) sum += Math.abs(data[i]);
    }
    return sum;
  });
  const target = sums.reduce((a, b) => a + b, 0) / (sums.length || 1);
  buffers.forEach((buf, idx) => {
    const factor = sums[idx] ? target / sums[idx] : 1;
    if (factor === 1) return;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] *= factor;
    }
  });
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
