import { describe, it, expect } from 'vitest';
import { humanTime, clamp, bytesHuman, suggestOutName } from '../src/utils.js';

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
});
