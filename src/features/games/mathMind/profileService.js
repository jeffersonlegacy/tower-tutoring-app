/**
 * profileService.js - User Profile Management
 * 
 * Handles username-based progress tracking with localStorage
 * and optional Firebase backup for cross-device sync.
 */

const STORAGE_KEY = 'mathmind_profiles';
const ACTIVE_USER_KEY = 'mathmind_active_user';

// ═══════════════════════════════════════════════════════════════
// DEFAULT PROFILE STRUCTURE
// ═══════════════════════════════════════════════════════════════

const createDefaultProfile = (username) => ({
    username,
    created: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    skills: {
        addition: { level: 1, correct: 0, total: 0, streak: 0, accuracy: 0 },
        subtraction: { level: 1, correct: 0, total: 0, streak: 0, accuracy: 0 },
        multiplication: { level: 1, correct: 0, total: 0, streak: 0, accuracy: 0 },
        division: { level: 1, correct: 0, total: 0, streak: 0, accuracy: 0 },
        order_ops: { level: 1, correct: 0, total: 0, streak: 0, accuracy: 0 }
    },
    stats: {
        totalProblems: 0,
        totalCorrect: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalTime: 0, // seconds
        sessionsCount: 0
    },
    achievements: [],
    settings: {
        soundEnabled: true,
        animationsEnabled: true
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
        console.error('[MathMind] Failed to save profiles:', e);
    }
};

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Get all usernames that have profiles
 */
export const getAvailableProfiles = () => {
    const profiles = getAllProfiles();
    return Object.keys(profiles).map(username => ({
        username,
        lastActive: profiles[username].lastActive,
        totalProblems: profiles[username].stats?.totalProblems || 0
    }));
};

/**
 * Get the currently active user (from session)
 */
export const getActiveUser = () => {
    try {
        return localStorage.getItem(ACTIVE_USER_KEY) || null;
    } catch {
        return null;
    }
};

/**
 * Set the active user
 */
export const setActiveUser = (username) => {
    try {
        if (username) {
            localStorage.setItem(ACTIVE_USER_KEY, username);
        } else {
            localStorage.removeItem(ACTIVE_USER_KEY);
        }
    } catch { }
};

/**
 * Get or create a profile for a username
 */
export const getProfile = (username) => {
    if (!username) return null;
    const profiles = getAllProfiles();

    if (!profiles[username]) {
        profiles[username] = createDefaultProfile(username);
        saveAllProfiles(profiles);
    }

    return profiles[username];
};

/**
 * Update a user's profile
 */
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
 * Record a problem attempt
 */
export const recordAttempt = (username, skillId, isCorrect, timeSpent = 0) => {
    const profiles = getAllProfiles();
    if (!profiles[username]) return null;

    const profile = profiles[username];
    const skill = profile.skills[skillId];

    if (!skill) return null;

    // Update skill stats
    skill.total++;
    if (isCorrect) {
        skill.correct++;
        skill.streak = Math.max(0, skill.streak) + 1;
    } else {
        skill.streak = Math.min(0, skill.streak) - 1;
    }
    skill.accuracy = skill.total > 0 ? skill.correct / skill.total : 0;

    // Update global stats
    profile.stats.totalProblems++;
    if (isCorrect) {
        profile.stats.totalCorrect++;
        profile.stats.currentStreak++;
        profile.stats.longestStreak = Math.max(profile.stats.longestStreak, profile.stats.currentStreak);
    } else {
        profile.stats.currentStreak = 0;
    }
    profile.stats.totalTime += timeSpent;

    profile.lastActive = new Date().toISOString();
    saveAllProfiles(profiles);

    return profile;
};

/**
 * Update a skill's level
 */
export const updateSkillLevel = (username, skillId, newLevel) => {
    const profiles = getAllProfiles();
    if (!profiles[username]?.skills?.[skillId]) return null;

    profiles[username].skills[skillId].level = Math.max(1, Math.min(4, newLevel));
    profiles[username].lastActive = new Date().toISOString();
    saveAllProfiles(profiles);

    return profiles[username];
};

/**
 * Add an achievement
 */
export const addAchievement = (username, achievementId) => {
    const profiles = getAllProfiles();
    if (!profiles[username]) return null;

    if (!profiles[username].achievements.includes(achievementId)) {
        profiles[username].achievements.push(achievementId);
        saveAllProfiles(profiles);
    }

    return profiles[username];
};

/**
 * Reset a specific skill's progress
 */
export const resetSkill = (username, skillId) => {
    const profiles = getAllProfiles();
    if (!profiles[username]?.skills?.[skillId]) return null;

    profiles[username].skills[skillId] = {
        level: 1,
        correct: 0,
        total: 0,
        streak: 0,
        accuracy: 0
    };
    saveAllProfiles(profiles);

    return profiles[username];
};

/**
 * Delete a profile entirely
 */
export const deleteProfile = (username) => {
    const profiles = getAllProfiles();
    if (profiles[username]) {
        delete profiles[username];
        saveAllProfiles(profiles);
    }

    // Clear active user if it was this profile
    if (getActiveUser() === username) {
        setActiveUser(null);
    }
};

/**
 * Get analytics summary for a user
 */
export const getAnalytics = (username) => {
    const profile = getProfile(username);
    if (!profile) return null;

    const skillsSummary = Object.entries(profile.skills).map(([id, data]) => ({
        id,
        name: id.replace('_', ' '),
        level: data.level,
        accuracy: Math.round(data.accuracy * 100),
        problems: data.total,
        mastered: data.level >= 4 && data.accuracy >= 0.9
    }));

    const masteredCount = skillsSummary.filter(s => s.mastered).length;
    const avgAccuracy = skillsSummary.length > 0
        ? Math.round(skillsSummary.reduce((a, s) => a + s.accuracy, 0) / skillsSummary.length)
        : 0;

    return {
        username: profile.username,
        totalProblems: profile.stats.totalProblems,
        overallAccuracy: profile.stats.totalProblems > 0
            ? Math.round((profile.stats.totalCorrect / profile.stats.totalProblems) * 100)
            : 0,
        currentStreak: profile.stats.currentStreak,
        longestStreak: profile.stats.longestStreak,
        masteredSkills: masteredCount,
        totalSkills: skillsSummary.length,
        skills: skillsSummary,
        avgAccuracy
    };
};
