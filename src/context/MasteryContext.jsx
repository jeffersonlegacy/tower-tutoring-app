import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CURRICULUM_DATA } from '../data/CurriculumData';

const MasteryContext = createContext(null);

export const MasteryProvider = ({ children }) => {
    // Progress shape: { [nodeId]: { status: 'locked' | 'unlocked' | 'completed', lastScore: 0 } }
    const [progress, setProgress] = useState(() => {
        const saved = localStorage.getItem('ji_mastery_progress');
        return saved ? JSON.parse(saved) : {};
    });

    // Profile shape: { xp: 0, level: 1, streak: 0, lastActive: 'ISO-DATE', currency: 0, missions: [] }
    const [studentProfile, setStudentProfile] = useState(() => {
        const saved = localStorage.getItem('ji_student_profile');
        return saved ? JSON.parse(saved) : { xp: 0, level: 1, streak: 0, lastActive: null, currency: 0, missions: [] };
    });

    useEffect(() => {
        localStorage.setItem('ji_student_profile', JSON.stringify(studentProfile));
    }, [studentProfile]);

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

            return { ...prev, streak: newStreak, lastActive: today };
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
        setStudentProfile({ xp: 0, level: 1, streak: 0, lastActive: null, currency: 0, missions: [] });
        localStorage.removeItem('ji_mastery_progress');
        localStorage.removeItem('ji_session_logs');
        localStorage.removeItem('ji_student_profile');
    }, []);

    const value = useMemo(() => ({
        progress,
        sessionLogs,
        studentProfile, // [NEW]
        awardXP,       // [NEW]
        checkStreak,   // [NEW]
        getNodeStatus,
        completeNode,
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
