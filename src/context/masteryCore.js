export const DEFAULT_PROFILE = {
  pv: 0,
  level: 1,
  streak: 0,
  lastActive: null,
  currency: 0,
  missions: [],
  unlockedAchievements: [],
  avatarConfig: null,
  towerTag: null,
  gameStats: {},
};

export const DEFAULT_COGNITIVE_STATE = {
  velocity: 0,
  focus: 100,
  learningStyle: 'balanced',
  recentErrors: [],
  conceptualMastery: {},
};

export const DEFAULT_ASSESSMENT_STATE = {
  status: 'pending',
  score: 0,
  path: null,
  startNode: null,
  history: [],
};

export const INITIAL_STATE = {
  activeSessionId: 'global',
  progress: {},
  sessionLogs: [],
  studentProfile: DEFAULT_PROFILE,
  cognitiveState: DEFAULT_COGNITIVE_STATE,
  assessmentState: DEFAULT_ASSESSMENT_STATE,
  notifications: [],
  consecutiveFailures: 0,
  isHydrated: false,
};

export function normalizeProfile(raw) {
  const next = { ...DEFAULT_PROFILE, ...(raw || {}) };
  if (raw?.xp !== undefined && raw?.pv === undefined) {
    next.pv = next.xp;
    delete next.xp;
  }
  if (!next.gameStats || typeof next.gameStats !== 'object') {
    next.gameStats = {};
  }
  if (!Array.isArray(next.unlockedAchievements)) {
    next.unlockedAchievements = [];
  }
  return next;
}

export function normalizeSessionData(raw) {
  return {
    progress: raw?.progress && typeof raw.progress === 'object' ? raw.progress : {},
    sessionLogs: Array.isArray(raw?.sessionLogs) ? raw.sessionLogs : [],
    studentProfile: normalizeProfile(raw?.studentProfile),
    cognitiveState: raw?.cognitiveState && typeof raw.cognitiveState === 'object'
      ? { ...DEFAULT_COGNITIVE_STATE, ...raw.cognitiveState }
      : DEFAULT_COGNITIVE_STATE,
    assessmentState: raw?.assessmentState && typeof raw.assessmentState === 'object'
      ? { ...DEFAULT_ASSESSMENT_STATE, ...raw.assessmentState }
      : DEFAULT_ASSESSMENT_STATE,
  };
}

export function masteryReducer(state, action) {
  switch (action.type) {
    case 'SET_ACTIVE_SESSION':
      return {
        ...state,
        activeSessionId: action.sessionId || 'global',
        isHydrated: false,
      };
    case 'HYDRATE_SESSION':
      return {
        ...state,
        ...action.payload,
        isHydrated: true,
      };
    case 'SET_PROGRESS':
      return { ...state, progress: action.progress };
    case 'SET_PROFILE':
      return { ...state, studentProfile: action.profile };
    case 'SET_LOGS':
      return { ...state, sessionLogs: action.logs };
    case 'APPEND_LOG': {
      const sessionLogs = [{ ...action.log, timestamp: Date.now() }, ...state.sessionLogs].slice(0, 100);
      return { ...state, sessionLogs };
    }
    case 'SET_COGNITIVE':
      return { ...state, cognitiveState: action.cognitiveState };
    case 'SET_ASSESSMENT':
      return { ...state, assessmentState: action.assessmentState };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.notification] };
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) };
    case 'SET_CONSECUTIVE_FAILURES':
      return { ...state, consecutiveFailures: action.value };
    case 'RESET_SESSION':
      return {
        ...state,
        progress: {},
        sessionLogs: [],
        studentProfile: DEFAULT_PROFILE,
        cognitiveState: DEFAULT_COGNITIVE_STATE,
        assessmentState: DEFAULT_ASSESSMENT_STATE,
      };
    default:
      return state;
  }
}
