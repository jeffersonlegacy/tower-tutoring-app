/**
 * profileService.js - Enhanced User Profile Management v2
 * 
 * FEATURES:
 * - XP and level tracking
 * - Problem history for pattern detection
 * - Session management
 * - Achievement unlocking
 */

const STORAGE_KEY = 'mathmind_profiles_v2';
const ACTIVE_USER_KEY = 'mathmind_active_user';
const MAX_HISTORY = 100; // Keep last 100 problems for pattern detection

// ═══════════════════════════════════════════════════════════════
// DEFAULT PROFILE STRUCTURE
// ═══════════════════════════════════════════════════════════════

const createDefaultProfile = (username) => ({
    username,
    created: new Date().toISOString(),
    lastActive: new Date().toISOString(),

    skills: {
        addition: { level: 1, xp: 0, correct: 0, total: 0, streak: 0, accuracy: 0, lastPracticed: null },
        subtraction: { level: 1, xp: 0, correct: 0, total: 0, streak: 0, accuracy: 0, lastPracticed: null },
        multiplication: { level: 1, xp: 0, correct: 0, total: 0, streak: 0, accuracy: 0, lastPracticed: null },
        division: { level: 1, xp: 0, correct: 0, total: 0, streak: 0, accuracy: 0, lastPracticed: null },
        order_ops: { level: 1, xp: 0, correct: 0, total: 0, streak: 0, accuracy: 0, lastPracticed: null }
    },

    stats: {
        totalProblems: 0,
        totalCorrect: 0,
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalTime: 0,
        sessionsCount: 0,
        fastAnswers: 0 // Under 5 seconds
    },

    achievements: [],
    problemHistory: [], // Last N problems for pattern detection

    settings: {
        soundEnabled: true,
        animationsEnabled: true,
        hintLevel: 'auto' // auto, always, never
    }
});

// ═══════════════════════════════════════════════════════════════
// STORAGE HELPERS
// ═══════════════════════════════════════════════════════════════

const getAllProfiles = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

const saveAllProfiles = (profiles) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
        console.error('[MathMind] Save failed:', e);
    }
};

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export const getAvailableProfiles = () => {
    const profiles = getAllProfiles();
    return Object.keys(profiles).map(username => ({
        username,
        lastActive: profiles[username].lastActive,
        totalXP: profiles[username].stats?.totalXP || 0,
        totalProblems: profiles[username].stats?.totalProblems || 0
    })).sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
};

export const getActiveUser = () => {
    try {
        return localStorage.getItem(ACTIVE_USER_KEY) || null;
    } catch {
        return null;
    }
};

export const setActiveUser = (username) => {
    try {
        if (username) localStorage.setItem(ACTIVE_USER_KEY, username);
        else localStorage.removeItem(ACTIVE_USER_KEY);
    } catch { }
};

export const getProfile = (username) => {
    if (!username) return null;
    const profiles = getAllProfiles();

    if (!profiles[username]) {
        profiles[username] = createDefaultProfile(username);
        saveAllProfiles(profiles);
    }

    return profiles[username];
};

export const updateProfile = (username, updates) => {
    if (!username) return null;
    const profiles = getAllProfiles();

    if (!profiles[username]) {
        profiles[username] = createDefaultProfile(username);
    }

    profiles[username] = {
        ...profiles[username],
        ...updates,
        lastActive: new Date().toISOString()
    };

    saveAllProfiles(profiles);
    return profiles[username];
};

/**
 * Record a problem attempt with full tracking
 */
export const recordAttempt = (username, problemData) => {
    const profiles = getAllProfiles();
    if (!profiles[username]) return null;

    const profile = profiles[username];
    const { skillId, correct, timeSpent = 0, xpReward = 5, problem, answer, userAnswer } = problemData;
    const skill = profile.skills[skillId];
    if (!skill) return null;

    // Update skill stats
    skill.total++;
    skill.lastPracticed = Date.now();

    if (correct) {
        skill.correct++;
        skill.xp += xpReward;
        skill.streak = Math.max(0, skill.streak) + 1;
        profile.stats.totalXP += xpReward;
    } else {
        skill.streak = Math.min(0, skill.streak) - 1;
    }
    skill.accuracy = skill.total > 0 ? skill.correct / skill.total : 0;

    // Update global stats
    profile.stats.totalProblems++;
    if (correct) {
        profile.stats.totalCorrect++;
        profile.stats.currentStreak++;
        profile.stats.longestStreak = Math.max(profile.stats.longestStreak, profile.stats.currentStreak);
    } else {
        profile.stats.currentStreak = 0;
    }
    profile.stats.totalTime += timeSpent;
    if (timeSpent < 5 && correct) profile.stats.fastAnswers++;

    // Add to history (for pattern detection)
    profile.problemHistory.push({
        skillId,
        problem,
        answer,
        userAnswer,
        correct,
        timeSpent,
        timestamp: Date.now()
    });

    // Trim history
    if (profile.problemHistory.length > MAX_HISTORY) {
        profile.problemHistory = profile.problemHistory.slice(-MAX_HISTORY);
    }

    profile.lastActive = new Date().toISOString();
    saveAllProfiles(profiles);

    return profile;
};

/**
 * Update skill level and XP
 */
export const updateSkillLevel = (username, skillId, newLevel, xp = null) => {
    const profiles = getAllProfiles();
    if (!profiles[username]?.skills?.[skillId]) return null;

    const skill = profiles[username].skills[skillId];
    skill.level = Math.max(1, Math.min(5, newLevel));
    if (xp !== null) skill.xp = xp;

    profiles[username].lastActive = new Date().toISOString();
    saveAllProfiles(profiles);

    return profiles[username];
};

/**
 * Unlock an achievement
 */
export const unlockAchievement = (username, achievementId) => {
    const profiles = getAllProfiles();
    if (!profiles[username]) return null;

    if (!profiles[username].achievements.includes(achievementId)) {
        profiles[username].achievements.push(achievementId);
        saveAllProfiles(profiles);
        return { unlocked: true, achievementId };
    }

    return { unlocked: false };
};

/**
 * Check for new achievements based on current state
 */
export const checkAchievements = (profile) => {
    const newAchievements = [];
    const existing = new Set(profile.achievements || []);

    // First problem
    if (profile.stats.totalProblems >= 1 && !existing.has('first_problem')) {
        newAchievements.push('first_problem');
    }

    // Streak achievements
    if (profile.stats.currentStreak >= 5 && !existing.has('streak_5')) newAchievements.push('streak_5');
    if (profile.stats.currentStreak >= 10 && !existing.has('streak_10')) newAchievements.push('streak_10');
    if (profile.stats.currentStreak >= 25 && !existing.has('streak_25')) newAchievements.push('streak_25');

    // Level achievements
    const maxLevel = Math.max(...Object.values(profile.skills || {}).map(s => s.level || 1));
    if (maxLevel >= 2 && !existing.has('level_up')) newAchievements.push('level_up');
    if (maxLevel >= 5 && !existing.has('master')) newAchievements.push('master');

    // All skills tried
    const skillsTried = Object.values(profile.skills || {}).filter(s => s.total > 0).length;
    if (skillsTried >= 5 && !existing.has('all_skills')) newAchievements.push('all_skills');

    // Speed demon
    if (profile.stats.fastAnswers >= 10 && !existing.has('speed_demon')) newAchievements.push('speed_demon');

    // Perfectionist (20 in a row)
    if (profile.stats.longestStreak >= 20 && !existing.has('perfectionist')) newAchievements.push('perfectionist');

    return newAchievements;
};

/**
 * Get problem history for pattern detection
 */
export const getProblemHistory = (username, limit = 50) => {
    const profile = getProfile(username);
    return profile?.problemHistory?.slice(-limit) || [];
};

/**
 * Get comprehensive analytics
 */
export const getAnalytics = (username) => {
    const profile = getProfile(username);
    if (!profile) return null;

    const skills = Object.entries(profile.skills).map(([id, data]) => ({
        id,
        level: data.level,
        xp: data.xp,
        accuracy: Math.round((data.accuracy || 0) * 100),
        problems: data.total,
        streak: data.streak,
        mastered: data.level >= 5
    }));

    const avgAccuracy = skills.length > 0
        ? Math.round(skills.reduce((a, s) => a + s.accuracy, 0) / skills.length)
        : 0;

    return {
        username: profile.username,
        totalProblems: profile.stats.totalProblems,
        totalXP: profile.stats.totalXP,
        currentStreak: profile.stats.currentStreak,
        longestStreak: profile.stats.longestStreak,
        overallAccuracy: profile.stats.totalProblems > 0
            ? Math.round((profile.stats.totalCorrect / profile.stats.totalProblems) * 100)
            : 0,
        avgAccuracy,
        skills,
        achievementCount: profile.achievements?.length || 0,
        masteredSkills: skills.filter(s => s.mastered).length,
        totalSkills: skills.length
    };
};

/**
 * Start a new session (increment counter)
 */
export const startSession = (username) => {
    const profiles = getAllProfiles();
    if (!profiles[username]) return null;

    profiles[username].stats.sessionsCount++;
    profiles[username].lastActive = new Date().toISOString();
    saveAllProfiles(profiles);

    return profiles[username];
};
