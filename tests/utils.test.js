import { describe, it, expect } from 'vitest';
import { humanTime, clamp, bytesHuman, suggestOutName, normalizeBuffers } from '../src/utils.js';

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
});
