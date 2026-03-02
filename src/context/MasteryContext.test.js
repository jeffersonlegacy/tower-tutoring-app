import { describe, expect, it } from 'vitest';
import { masteryReducer, normalizeProfile } from './masteryCore';

describe('normalizeProfile', () => {
  it('migrates xp to pv and preserves defaults', () => {
    const profile = normalizeProfile({ xp: 120, towerTag: 'alpha' });
    expect(profile.pv).toBe(120);
    expect(profile.xp).toBeUndefined();
    expect(profile.towerTag).toBe('alpha');
    expect(profile.gameStats).toEqual({});
  });
});

describe('masteryReducer', () => {
  it('appends log entries with bounded list behavior', () => {
    const initial = {
      activeSessionId: 'demo',
      progress: {},
      sessionLogs: [],
      studentProfile: { pv: 0, level: 1, currency: 0, gameStats: {}, unlockedAchievements: [] },
      cognitiveState: {},
      assessmentState: {},
      notifications: [],
      consecutiveFailures: 0,
      isHydrated: true,
    };

    const next = masteryReducer(initial, {
      type: 'APPEND_LOG',
      log: { type: 'pv_gain', data: { amount: 10 } },
    });

    expect(next.sessionLogs.length).toBe(1);
    expect(next.sessionLogs[0].type).toBe('pv_gain');
    expect(next.sessionLogs[0].data.amount).toBe(10);
    expect(typeof next.sessionLogs[0].timestamp).toBe('number');
  });
});
