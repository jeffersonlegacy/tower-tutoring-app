import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CURRICULUM_DATA } from '../data/CurriculumData';

const MasteryContext = createContext(null);

export const MasteryProvider = ({ children }) => {
    // Get sessionId from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    // Note: In SessionPage we use useParams, but MasteryProvider is global.
    // We'll use a more robust way to track the active session ID inside the provider.
    const [activeSessionId, setActiveSessionId] = useState(() => {
        const pathParts = window.location.pathname.split('/');
        const id = pathParts[pathParts.indexOf('session') + 1];
        return id ? id.toLowerCase() : 'global';
    });

    // Update activeSessionId on navigation
    useEffect(() => {
        const handleLocationChange = () => {
            const pathParts = window.location.pathname.split('/');
            const id = pathParts[pathParts.indexOf('session') + 1];
            if (id) setActiveSessionId(id.toLowerCase());
        };
        window.addEventListener('popstate', handleLocationChange);
        // Also listen to custom events if using a router that doesn't trigger popstate on push
        return () => window.removeEventListener('popstate', handleLocationChange);
    }, []);

    const profileKey = `ji_profile_${activeSessionId}`;
    const progressKey = `ji_progress_${activeSessionId}`;
    const logsKey = `ji_logs_${activeSessionId}`;

    // Progress shape: { [nodeId]: { status: 'locked' | 'unlocked' | 'completed', lastScore: 0 } }
    const [progress, setProgress] = useState({});

    // Profile shape: { xp: 0, level: 1, streak: 0, lastActive: 'ISO-DATE', currency: 0, missions: [], unlockedAchievements: [], avatarConfig: null }
    const [studentProfile, setStudentProfile] = useState({ 
        xp: 0, 
        level: 1, 
        streak: 0, 
        lastActive: null, 
        currency: 0, 
        missions: [], 
        unlockedAchievements: [],
        avatarConfig: null 
    });

    const [sessionLogs, setSessionLogs] = useState([]);

    // Load data when activeSessionId changes
    useEffect(() => {
        const savedProgress = localStorage.getItem(progressKey);
        const savedProfile = localStorage.getItem(profileKey);
        const savedLogs = localStorage.getItem(logsKey);

        setProgress(savedProgress ? JSON.parse(savedProgress) : {});
        setStudentProfile(savedProfile ? JSON.parse(savedProfile) : { xp: 0, level: 1, streak: 0, lastActive: null, currency: 0, missions: [], unlockedAchievements: [] });
        setSessionLogs(savedLogs ? JSON.parse(savedLogs) : []);
    }, [activeSessionId, progressKey, profileKey, logsKey]);

    // Persist data when it changes
    useEffect(() => {
        if (activeSessionId === 'global') return;
        localStorage.setItem(progressKey, JSON.stringify(progress));
    }, [progress, progressKey, activeSessionId]);

    useEffect(() => {
        if (activeSessionId === 'global') return;
        localStorage.setItem(profileKey, JSON.stringify(studentProfile));
    }, [studentProfile, profileKey, activeSessionId]);

    const logEvent = useCallback((type, data) => {
        console.log(`[Mastery] ${type}`, data);
        setSessionLogs(prev => {
            const newLogs = [{ type, data, timestamp: Date.now() }, ...prev].slice(0, 100);
            localStorage.setItem(logsKey, JSON.stringify(newLogs));
            return newLogs;
        });
    }, [logsKey]);

    // [RESTORED] Get Node Status
    const getNodeStatus = useCallback((nodeId) => {
        // Simple logic: If in progress, return status. Else default to 'unlocked' for MVP/Testing
        // Or strictly 'locked' if dependencies not met.
        // For Math Camp, let's assume 'unlocked' for now or check map.
        return progress[nodeId]?.status || 'unlocked'; 
    }, [progress]);

    const awardXP = useCallback((amount, reason) => {
        setStudentProfile(prev => {
            const newXP = prev.xp + amount;
            // Simple level curve: Level * 500 XP
            const xpForNextLevel = prev.level * 500;
            let newLevel = prev.level;
            
            if (newXP >= xpForNextLevel) {
                newLevel += 1;
                logEvent('level_up', { level: newLevel });
            }

            return {
                ...prev,
                xp: newXP,
                level: newLevel,
                currency: prev.currency + Math.floor(amount / 10) // 10% of XP as coins
            };
        });
        logEvent('xp_gain', { amount, reason });
    }, [logEvent]);

    const checkStreak = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        setStudentProfile(prev => {
            if (prev.lastActive === today) return prev; // Already active today

            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const isConsecutive = prev.lastActive === yesterday;
            const newStreak = isConsecutive ? prev.streak + 1 : 1;
            
            // Check Streak Achievement
            if (newStreak >= 5) unlockAchievement('streak_5');
            if (newStreak >= 10) unlockAchievement('streak_10');

            return { ...prev, streak: newStreak, lastActive: today };
        });
    }, []);

    // Notifications queue for UX
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((type, data) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, data }]);
        
        // Auto-dismiss after 3s (consumer can also dismiss)
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const unlockAchievement = useCallback((achievementId) => {
        setStudentProfile(prev => {
            if (prev.unlockedAchievements.includes(achievementId)) return prev;
            
            logEvent('achievement_unlocked', { achievementId });
            addNotification('achievement', { id: achievementId }); // Trigger Toast
            
            return { 
                ...prev, 
                unlockedAchievements: [...prev.unlockedAchievements, achievementId],
                xp: prev.xp + 50 // Bonus XP for achievements
            };
        });
    }, [logEvent, addNotification]);

    const checkAchievements = useCallback(() => {
        setStudentProfile(prev => {
            const unlocked = [...prev.unlockedAchievements];
            let newXP = prev.xp;
            
            // Check Level Achievements
            if (prev.level >= 2 && !unlocked.includes('level_up')) {
                unlocked.push('level_up');
                newXP += 50;
            }
            if (prev.level >= 5 && !unlocked.includes('master')) {
                unlocked.push('master');
                newXP += 100;
            }
            
            if (unlocked.length === prev.unlockedAchievements.length) return prev;
            
            return { ...prev, unlockedAchievements: unlocked, xp: newXP };
        });
    }, []);

    const completeNode = useCallback((nodeId, score = 100) => {
        setProgress(prev => ({
            ...prev,
            [nodeId]: { status: 'completed', lastScore: score, timestamp: Date.now() }
        }));
        
        // Award XP for node completion
        awardXP(100, `Completed ${nodeId}`);
        checkStreak(); // Activity counts for streak
        
        logEvent('mastery', { nodeId, score });
    }, [logEvent, awardXP, checkStreak]);

    const resetProgress = useCallback(() => {
        setProgress({});
        setSessionLogs([]);
        setStudentProfile({ xp: 0, level: 1, streak: 0, lastActive: null, currency: 0, missions: [], unlockedAchievements: [] });
        localStorage.removeItem('ji_mastery_progress');
        localStorage.removeItem('ji_session_logs');
        localStorage.removeItem('ji_student_profile');
    }, []);

    const value = useMemo(() => ({
        progress,
        sessionLogs,
        studentProfile,
        notifications, // [NEW]
        awardXP,
        checkStreak,
        unlockAchievement,
        getNodeStatus,
        completeNode,
        setAvatarConfig,
        logEvent,
        resetProgress,
        curriculum: CURRICULUM_DATA
    }), [progress, sessionLogs, studentProfile, awardXP, checkStreak, getNodeStatus, completeNode, logEvent, resetProgress]);

    return (
        <MasteryContext.Provider value={value}>
            {children}
        </MasteryContext.Provider>
    );
};

export const useMastery = () => {
    const context = useContext(MasteryContext);
    if (!context) throw new Error('useMastery must be used within a MasteryProvider');
    return context;
};
