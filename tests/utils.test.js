import { describe, it, expect } from 'vitest';
import { humanTime, clamp, bytesHuman, suggestOutName, normalizeBuffers, stretchChannelData, stretchBuffer, bufferStrength, getChannelOrFallback } from '../src/utils.js';

describe('utility functions', () => {
  it('formats human time', () => {
    expect(humanTime(65)).toBe('1:05');
  });

  it('clamps values within range', () => {
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(-1, 0, 5)).toBe(0);
  });

  it('formats bytes to human readable string', () => {
    expect(bytesHuman(1000)).toBe('1000 B');
    expect(bytesHuman(1024)).toBe('1.00 KB');
  });

  it('suggests output name based on inputs', () => {
    expect(suggestOutName('a.mp3', 'b.wav')).toBe('a__AVERAGE__b.wav');
    expect(suggestOutName('a.mp3', 'b.wav', 'c.ogg')).toBe('a__AVERAGE__b__AVERAGE__c.wav');
    expect(suggestOutName('a.mp3')).toBe('a.wav');
  });

  it('normalizes buffers to equal sums', () => {
    function makeBuffer(data) {
      return {
        numberOfChannels: 1,
        length: data.length,
        getChannelData: () => data,
      };
    }
    const buf1 = makeBuffer(new Float32Array([1,1,1,1])); // sum=4
    const buf2 = makeBuffer(new Float32Array([0.5,0.5,0.5,0.5])); // sum=2
    normalizeBuffers([buf1, buf2]);
    expect(Array.from(buf1.getChannelData(0))).toEqual([0.75,0.75,0.75,0.75]);
    expect(Array.from(buf2.getChannelData(0))).toEqual([0.75,0.75,0.75,0.75]);
  });

  it('stretches channel data using linear interpolation', () => {
    const stretched = stretchChannelData(new Float32Array([0, 10]), 5);
    expect(Array.from(stretched)).toEqual([0, 2.5, 5, 7.5, 10]);
  });

  it('stretches multi-channel buffers to the target length', () => {
    function makeBuffer({ length, numberOfChannels }) {
      const channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
      return {
        numberOfChannels,
        length,
        sampleRate: 44100,
        getChannelData: (ch) => channels[ch],
        _data: channels,
      };
    }
    const src = makeBuffer({ length: 2, numberOfChannels: 2 });
    src.getChannelData(0).set([0, 1]);
    src.getChannelData(1).set([1, 0]);

    const stretched = stretchBuffer(src, 4, ({ length, numberOfChannels, sampleRate }) => {
      const b = makeBuffer({ length, numberOfChannels });
      b.sampleRate = sampleRate;
      return b;
    });

    expect(stretched.length).toBe(4);
    const ch0 = Array.from(stretched.getChannelData(0));
    const ch1 = Array.from(stretched.getChannelData(1));
    ch0.forEach((v, idx) => expect(v).toBeCloseTo([0, 1/3, 2/3, 1][idx]));
    ch1.forEach((v, idx) => expect(v).toBeCloseTo([1, 2/3, 1/3, 0][idx]));
  });

  it('measures buffer strength after stretching', () => {
    function makeBuffer({ length, numberOfChannels }) {
      const channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
      return {
        numberOfChannels,
        length,
        sampleRate: 44100,
        getChannelData: (ch) => channels[ch],
        _data: channels,
      };
    }

    const src = makeBuffer({ length: 2, numberOfChannels: 1 });
    src.getChannelData(0).set([0, 2]);

    const stretched = stretchBuffer(src, 4, ({ length, numberOfChannels, sampleRate }) => {
      const b = makeBuffer({ length, numberOfChannels });
      b.sampleRate = sampleRate;
      return b;
    });

    expect(bufferStrength(stretched)).toBeCloseTo(1); // avg abs amplitude across stretched samples
    expect(bufferStrength(stretched, 2)).toBeCloseTo(2/6); // partial window reflects stretched values, not the pre-stretch samples
  });

  it('falls back to the last available channel when requested channel is missing', () => {
    const channels = [new Float32Array([1, 2]), new Float32Array([3, 4])];
    const buffer = {
      numberOfChannels: 2,
      length: 2,
      getChannelData: (ch) => channels[ch],
    };

    expect(Array.from(getChannelOrFallback(buffer, 0))).toEqual([1, 2]);
    expect(Array.from(getChannelOrFallback(buffer, 1))).toEqual([3, 4]);
    expect(Array.from(getChannelOrFallback(buffer, 5))).toEqual([3, 4]);
  });
});
