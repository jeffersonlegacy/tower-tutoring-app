import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { CURRICULUM_DATA } from '../data/CurriculumData';
import { db } from '../services/firebase';
import { publishEvent } from '../services/eventBus';
import { trackError, trackEvent } from '../services/telemetry';
import {
  DEFAULT_ASSESSMENT_STATE,
  DEFAULT_COGNITIVE_STATE,
  DEFAULT_PROFILE,
  INITIAL_STATE,
  masteryReducer,
  normalizeSessionData,
} from './masteryCore';

const MasteryContext = createContext(null);

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}


function getStorageKeys(sessionId) {
  return {
    profileKey: `ji_profile_${sessionId}`,
    progressKey: `ji_progress_${sessionId}`,
    logsKey: `ji_logs_${sessionId}`,
    migratedKey: `ji_migrated_${sessionId}`,
  };
}

export function MasteryProvider({ children }) {
  const [state, dispatch] = useReducer(masteryReducer, INITIAL_STATE);
  const cloudSyncTimeoutRef = useRef(null);

  const initSession = useCallback((sessionId) => {
    if (!sessionId) return;
    const normalized = sessionId.toLowerCase();
    dispatch({ type: 'SET_ACTIVE_SESSION', sessionId: normalized });
    trackEvent('session.init', { sessionId: normalized });
  }, []);

  const logEvent = useCallback((type, data = {}) => {
    dispatch({ type: 'APPEND_LOG', log: { type, data } });
  }, []);

  const addNotification = useCallback((type, data) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    dispatch({ type: 'ADD_NOTIFICATION', notification: { id, type, data } });
    publishEvent('tower-notification', { type, data });
    window.setTimeout(() => dispatch({ type: 'REMOVE_NOTIFICATION', id }), 5000);
  }, []);

  useEffect(() => {
    const sessionId = state.activeSessionId;
    if (!sessionId || sessionId === 'global') {
      dispatch({
        type: 'HYDRATE_SESSION',
        payload: {
          progress: {},
          sessionLogs: [],
          studentProfile: DEFAULT_PROFILE,
          cognitiveState: DEFAULT_COGNITIVE_STATE,
          assessmentState: DEFAULT_ASSESSMENT_STATE,
        },
      });
      return;
    }

    let mounted = true;
    const hydrate = async () => {
      const { profileKey, progressKey, logsKey, migratedKey } = getStorageKeys(sessionId);

      const localHydrated = normalizeSessionData({
        progress: safeJsonParse(localStorage.getItem(progressKey), {}),
        sessionLogs: safeJsonParse(localStorage.getItem(logsKey), []),
        studentProfile: safeJsonParse(localStorage.getItem(profileKey), DEFAULT_PROFILE),
      });

      if (mounted) {
        dispatch({ type: 'HYDRATE_SESSION', payload: localHydrated });
      }

      try {
        const sessionRef = doc(db, 'sessions', sessionId);
        const snapshot = await getDoc(sessionRef);
        if (!mounted) return;

        if (snapshot.exists()) {
          const cloudData = normalizeSessionData(snapshot.data());
          dispatch({ type: 'HYDRATE_SESSION', payload: cloudData });
          localStorage.setItem(progressKey, JSON.stringify(cloudData.progress));
          localStorage.setItem(profileKey, JSON.stringify(cloudData.studentProfile));
          localStorage.setItem(logsKey, JSON.stringify(cloudData.sessionLogs));
          localStorage.setItem(migratedKey, '1');
        } else {
          const hasLegacy = Object.keys(localHydrated.progress).length > 0
            || localHydrated.sessionLogs.length > 0
            || (localHydrated.studentProfile?.pv || 0) > 0;
          if (hasLegacy && !localStorage.getItem(migratedKey)) {
            await setDoc(sessionRef, {
              ...localHydrated,
              migratedFromLocalStorage: true,
              updatedAt: serverTimestamp(),
            }, { merge: true });
            localStorage.setItem(migratedKey, '1');
          }
        }
      } catch (error) {
        trackError('mastery.hydrate', error, { sessionId });
      }
    };

    hydrate();
    return () => {
      mounted = false;
    };
  }, [state.activeSessionId]);

  useEffect(() => {
    const sessionId = state.activeSessionId;
    if (!sessionId || sessionId === 'global' || !state.isHydrated) return;
    const { profileKey, progressKey, logsKey } = getStorageKeys(sessionId);
    localStorage.setItem(progressKey, JSON.stringify(state.progress));
    localStorage.setItem(profileKey, JSON.stringify(state.studentProfile));
    localStorage.setItem(logsKey, JSON.stringify(state.sessionLogs));
  }, [state.activeSessionId, state.isHydrated, state.progress, state.sessionLogs, state.studentProfile]);

  useEffect(() => {
    const sessionId = state.activeSessionId;
    if (!sessionId || sessionId === 'global' || !state.isHydrated) return;
    window.clearTimeout(cloudSyncTimeoutRef.current);
    cloudSyncTimeoutRef.current = window.setTimeout(async () => {
      try {
        await setDoc(doc(db, 'sessions', sessionId), {
          progress: state.progress,
          sessionLogs: state.sessionLogs,
          studentProfile: state.studentProfile,
          cognitiveState: state.cognitiveState,
          assessmentState: state.assessmentState,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        trackError('mastery.cloudSync', error, { sessionId });
      }
    }, 350);

    return () => window.clearTimeout(cloudSyncTimeoutRef.current);
  }, [
    state.activeSessionId,
    state.assessmentState,
    state.cognitiveState,
    state.isHydrated,
    state.progress,
    state.sessionLogs,
    state.studentProfile,
  ]);

  const getNodeStatus = useCallback((nodeId) => state.progress[nodeId]?.status || 'unlocked', [state.progress]);

  const awardPV = useCallback((amount, reason) => {
    const pvGain = Number.isFinite(amount) ? amount : 0;
    const current = state.studentProfile;
    const newPV = (current.pv || 0) + pvGain;
    const pvForNextLevel = current.level * 500;
    const leveledUp = newPV >= pvForNextLevel;
    const level = leveledUp ? current.level + 1 : current.level;

    dispatch({
      type: 'SET_PROFILE',
      profile: {
        ...current,
        pv: newPV,
        level,
        currency: (current.currency || 0) + Math.floor(pvGain / 10),
      },
    });

    logEvent('pv_gain', { amount: pvGain, reason });
    if (leveledUp) logEvent('level_up', { level });
  }, [logEvent, state.studentProfile]);

  const awardXP = useCallback((amount, reason) => {
    awardPV(amount, reason);
  }, [awardPV]);

  const unlockAchievement = useCallback((achievementId) => {
    const current = state.studentProfile;
    if (current.unlockedAchievements.includes(achievementId)) return;
    dispatch({
      type: 'SET_PROFILE',
      profile: {
        ...current,
        unlockedAchievements: [...current.unlockedAchievements, achievementId],
        pv: (current.pv || 0) + 50,
      },
    });
    logEvent('achievement_unlocked', { achievementId });
    addNotification('achievement', { id: achievementId });
  }, [addNotification, logEvent, state.studentProfile]);

  const checkStreak = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const current = state.studentProfile;
    if (current.lastActive === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const streak = current.lastActive === yesterday ? current.streak + 1 : 1;

    dispatch({
      type: 'SET_PROFILE',
      profile: { ...current, streak, lastActive: today },
    });
    if (streak >= 5) unlockAchievement('streak_5');
    if (streak >= 10) unlockAchievement('streak_10');
  }, [state.studentProfile, unlockAchievement]);

  const setAvatarConfig = useCallback((config) => {
    dispatch({ type: 'SET_PROFILE', profile: { ...state.studentProfile, avatarConfig: config } });
    logEvent('avatar_update', { config });
  }, [logEvent, state.studentProfile]);

  const setTowerTag = useCallback((tag) => {
    dispatch({ type: 'SET_PROFILE', profile: { ...state.studentProfile, towerTag: tag } });
    logEvent('towertag_set', { tag });
  }, [logEvent, state.studentProfile]);

  const updateGameStats = useCallback((gameId, result) => {
    const current = state.studentProfile;
    const existing = current.gameStats[gameId] || { wins: 0, losses: 0, highScore: 0 };
    const nextStats = {
      wins: existing.wins + (result.win ? 1 : 0),
      losses: existing.losses + (result.win ? 0 : 1),
      highScore: Math.max(existing.highScore, result.score || 0),
    };
    const nextProfile = {
      ...current,
      gameStats: { ...current.gameStats, [gameId]: nextStats },
    };
    dispatch({ type: 'SET_PROFILE', profile: nextProfile });
    logEvent('game_result', { gameId, ...result });

    if (current.towerTag) {
      setDoc(doc(db, 'leaderboards', gameId, 'scores', current.towerTag), {
        towerTag: current.towerTag,
        highScore: nextStats.highScore,
        wins: nextStats.wins,
        avatarConfig: current.avatarConfig || null,
        lastActive: serverTimestamp(),
      }, { merge: true }).catch((error) => {
        trackError('mastery.leaderboardSync', error, { gameId, towerTag: current.towerTag });
      });
    }
  }, [logEvent, state.studentProfile]);

  const reportFailure = useCallback(() => {
    const next = state.consecutiveFailures + 1;
    if (next >= 3) {
      addNotification('ai_nudge', {
        message: "I notice you're hitting a wall. Want a hint?",
        action: 'open_chat',
      });
      dispatch({ type: 'SET_CONSECUTIVE_FAILURES', value: 0 });
      return;
    }
    dispatch({ type: 'SET_CONSECUTIVE_FAILURES', value: next });
  }, [addNotification, state.consecutiveFailures]);

  const reportSuccess = useCallback(() => {
    dispatch({ type: 'SET_CONSECUTIVE_FAILURES', value: 0 });
  }, []);

  const completeNode = useCallback((nodeId, score = 100) => {
    dispatch({
      type: 'SET_PROGRESS',
      progress: {
        ...state.progress,
        [nodeId]: { status: 'completed', lastScore: score, timestamp: Date.now() },
      },
    });
    awardPV(100, `Completed ${nodeId}`);
    checkStreak();
    logEvent('mastery', { nodeId, score });
  }, [awardPV, checkStreak, logEvent, state.progress]);

  const resetProgress = useCallback(() => {
    dispatch({ type: 'RESET_SESSION' });
    const { profileKey, progressKey, logsKey } = getStorageKeys(state.activeSessionId);
    localStorage.removeItem(profileKey);
    localStorage.removeItem(progressKey);
    localStorage.removeItem(logsKey);
  }, [state.activeSessionId]);

  const recordGateCheck = useCallback((trackId, score) => {
    const current = state.cognitiveState;
    const currentMastery = current.conceptualMastery[trackId] || 0;
    const newMastery = (currentMastery * 0.5) + (score * 0.5);
    dispatch({
      type: 'SET_COGNITIVE',
      cognitiveState: {
        ...current,
        conceptualMastery: {
          ...current.conceptualMastery,
          [trackId]: newMastery,
        },
      },
    });
    if (score > 0.9) {
      awardPV(50, `Exceptional Mastery in ${trackId}`);
    }
    logEvent('gate_check_complete', { trackId, score });
  }, [awardPV, logEvent, state.cognitiveState]);

  const updateCognitiveState = useCallback((metrics) => {
    const current = state.cognitiveState;
    const timeFactor = Math.max(0.1, 1 - (metrics.timeSpent / 600));
    const sessionVelocity = metrics.score * timeFactor;
    const velocity = Math.round((current.velocity * 0.8) + (sessionVelocity * 0.2));
    const recentErrors = metrics.errorType
      ? [...current.recentErrors, metrics.errorType].slice(-5)
      : current.recentErrors;
    dispatch({
      type: 'SET_COGNITIVE',
      cognitiveState: { ...current, velocity, recentErrors },
    });
  }, [state.cognitiveState]);

  const updateAssessment = useCallback((result) => {
    const nextAssessment = {
      ...state.assessmentState,
      status: 'completed',
      score: result.score,
      path: result.path,
      startNode: result.startNode,
      history: [...state.assessmentState.history, { date: new Date().toISOString(), result }],
    };
    dispatch({ type: 'SET_ASSESSMENT', assessmentState: nextAssessment });
    logEvent('assessment_complete', result);
  }, [logEvent, state.assessmentState]);

  const getRecommendedSession = useCallback(() => {
    if (state.assessmentState.status !== 'completed') {
      const rootNode = CURRICULUM_DATA.nodes[CURRICULUM_DATA.rootNodeId];
      return {
        node: rootNode,
        mode: 'assessment',
        rationale: "Let's find your starting point.",
      };
    }

    const completedIds = Object.keys(state.progress).filter((k) => state.progress[k].status === 'completed');
    const nextNodes = [];
    Object.values(CURRICULUM_DATA.nodes).forEach((node) => {
      if (!completedIds.includes(node.id)) {
        const allPrereqsMet = node.prerequisites.every((id) => completedIds.includes(id));
        if (allPrereqsMet) nextNodes.push(node);
      }
    });

    const targetNode = nextNodes.length > 0
      ? nextNodes[0]
      : (CURRICULUM_DATA.nodes[state.assessmentState.startNode] || CURRICULUM_DATA.nodes[CURRICULUM_DATA.rootNodeId]);

    return {
      node: targetNode,
      mode: state.assessmentState.path || 'train',
      rationale: `Continuing your ${state.assessmentState.path} journey starting with ${targetNode.title}.`,
    };
  }, [state.assessmentState.path, state.assessmentState.startNode, state.assessmentState.status, state.progress]);

  const value = useMemo(() => ({
    activeSessionId: state.activeSessionId,
    progress: state.progress,
    sessionLogs: state.sessionLogs,
    studentProfile: state.studentProfile,
    cognitiveState: state.cognitiveState,
    assessmentState: state.assessmentState,
    notifications: state.notifications,
    initSession,
    awardPV,
    awardXP,
    checkStreak,
    unlockAchievement,
    getNodeStatus,
    completeNode,
    setAvatarConfig,
    setTowerTag,
    updateGameStats,
    recordGateCheck,
    logEvent,
    resetProgress,
    updateCognitiveState,
    reportFailure,
    reportSuccess,
    updateAssessment,
    getRecommendedSession,
    curriculum: CURRICULUM_DATA,
  }), [
    awardPV,
    awardXP,
    checkStreak,
    completeNode,
    getNodeStatus,
    getRecommendedSession,
    initSession,
    logEvent,
    recordGateCheck,
    reportFailure,
    reportSuccess,
    resetProgress,
    setAvatarConfig,
    setTowerTag,
    state.activeSessionId,
    state.assessmentState,
    state.cognitiveState,
    state.notifications,
    state.progress,
    state.sessionLogs,
    state.studentProfile,
    unlockAchievement,
    updateAssessment,
    updateCognitiveState,
    updateGameStats,
  ]);

  return (
    <MasteryContext.Provider value={value}>
      {children}
    </MasteryContext.Provider>
  );
}

export function useMastery() {
  const context = useContext(MasteryContext);
  if (!context) throw new Error('useMastery must be used within a MasteryProvider');
  return context;
}
