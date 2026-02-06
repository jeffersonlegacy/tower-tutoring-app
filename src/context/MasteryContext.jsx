import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CURRICULUM_DATA } from '../data/CurriculumData';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

    // Profile shape: { pv: 0, level: 1, streak: 0, lastActive: 'ISO-DATE', currency: 0, actions: [], unlockedAchievements: [], avatarConfig: null, towerTag: null, gameStats: {} }
    const [studentProfile, setStudentProfile] = useState({ 
        pv: 0, 
        level: 1, 
        streak: 0, 
        lastActive: null, 
        currency: 0, 
        missions: [], 
        unlockedAchievements: [],
        avatarConfig: null,
        towerTag: null,
        gameStats: {} // { gameId: { wins: 0, losses: 0, highScore: 0 } }
    });

    const [sessionLogs, setSessionLogs] = useState([]);

    // Load data with MIGRATION logic (XP -> PV, + TowerTag)
    useEffect(() => {
        const savedProgress = localStorage.getItem(progressKey);
        const savedProfileStr = localStorage.getItem(profileKey);
        const savedLogs = localStorage.getItem(logsKey);

        setProgress(savedProgress ? JSON.parse(savedProgress) : {});
        
        if (savedProfileStr) {
            const parsed = JSON.parse(savedProfileStr);
            // MIGRATION: Convert XP to PV if PV doesn't exist
            if (parsed.xp !== undefined && parsed.pv === undefined) {
                console.log('[Mastery] Migrating XP to PV...');
                parsed.pv = parsed.xp;
                delete parsed.xp;
            }
            // Ensure gameStats exists
            if (!parsed.gameStats) parsed.gameStats = {};
            
            setStudentProfile(parsed);
        } else {
             setStudentProfile({ 
                pv: 0, level: 1, streak: 0, lastActive: null, currency: 0, 
                missions: [], unlockedAchievements: [], towerTag: null, gameStats: {} 
            });
        }

        setSessionLogs(savedLogs ? JSON.parse(savedLogs) : []);
    }, [activeSessionId, progressKey, profileKey, logsKey]);

    // Persist data
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

    const getNodeStatus = useCallback((nodeId) => {
        return progress[nodeId]?.status || 'unlocked'; 
    }, [progress]);

    const awardPV = useCallback((amount, reason) => {
        setStudentProfile(prev => {
            const newPV = (prev.pv || 0) + amount;
            // Simple level curve: Level * 500 PV
            const pvForNextLevel = prev.level * 500;
            let newLevel = prev.level;
            
            if (newPV >= pvForNextLevel) {
                newLevel += 1;
                logEvent('level_up', { level: newLevel });
            }

            return {
                ...prev,
                pv: newPV,
                level: newLevel,
                currency: prev.currency + Math.floor(amount / 10) // 10% of PV as coins
            };
        });
        logEvent('pv_gain', { amount, reason });
    }, [logEvent]);

    const checkStreak = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        setStudentProfile(prev => {
            if (prev.lastActive === today) return prev; 

            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const isConsecutive = prev.lastActive === yesterday;
            const newStreak = isConsecutive ? prev.streak + 1 : 1;
            
            if (newStreak >= 5) unlockAchievement('streak_5');
            if (newStreak >= 10) unlockAchievement('streak_10');

            return { ...prev, streak: newStreak, lastActive: today };
        });
    }, []);

    const setAvatarConfig = useCallback((config) => {
        setStudentProfile(prev => ({ ...prev, avatarConfig: config }));
        logEvent('avatar_update', { config });
    }, [logEvent]);

    const setTowerTag = useCallback((tag) => {
        setStudentProfile(prev => ({ ...prev, towerTag: tag }));
        logEvent('towertag_set', { tag });
    }, [logEvent]);

    const updateGameStats = useCallback((gameId, result) => {
        // result: { win: boolean, score: number }
        setStudentProfile(prev => {
            const currentStats = prev.gameStats[gameId] || { wins: 0, losses: 0, highScore: 0 };
            const newStats = {
                wins: currentStats.wins + (result.win ? 1 : 0),
                losses: currentStats.losses + (result.win ? 0 : 1),
                highScore: Math.max(currentStats.highScore, result.score || 0)
            };

            // FIREBASE SYNC (Multiplayer Leaderboard)
            if (prev.towerTag) {
                const scoreDocRef = doc(db, 'leaderboards', gameId, 'scores', prev.towerTag);
                setDoc(scoreDocRef, {
                    towerTag: prev.towerTag,
                    highScore: newStats.highScore,
                    wins: newStats.wins, // We can track total wins too
                    lastActive: serverTimestamp(),
                    avatarConfig: prev.avatarConfig || null // Show avatar on leaderboard!
                }, { merge: true }).catch(err => console.error("Leaderboard Sync Failed:", err));
            }
            
            return {
                ...prev,
                gameStats: {
                    ...prev.gameStats,
                    [gameId]: newStats
                }
            };
        });
        logEvent('game_result', { gameId, ...result });
    }, [logEvent]);

    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((type, data) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, data }]);
        
        // Dispatch global event for widgets like GeminiChat to listen to
        window.dispatchEvent(new CustomEvent('tower-notification', { detail: { type, data } }));

        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    // Proactive Support Tracking
    const [consecutiveFailures, setConsecutiveFailures] = useState(0);

    const reportFailure = useCallback(() => {
        setConsecutiveFailures(prev => {
            const newVal = prev + 1;
            if (newVal >= 3) {
                // Trigger AI Help Nudge
                addNotification('ai_nudge', { 
                    message: "I notice you're hitting a wall. Want a hint?", 
                    action: 'open_chat' 
                });
                return 0; // Reset after nudge
            }
            return newVal;
        });
    }, [addNotification]);

    const reportSuccess = useCallback(() => {
        setConsecutiveFailures(0);
    }, []);

    const unlockAchievement = useCallback((achievementId) => {
        setStudentProfile(prev => {
            if (prev.unlockedAchievements.includes(achievementId)) return prev;
            
            logEvent('achievement_unlocked', { achievementId });
            addNotification('achievement', { id: achievementId }); 
            
            return { 
                ...prev, 
                unlockedAchievements: [...prev.unlockedAchievements, achievementId],
                pv: (prev.pv || 0) + 50 // Bonus PV for achievements
            };
        });
    }, [logEvent, addNotification]);

    const checkAchievements = useCallback(() => {
        setStudentProfile(prev => {
            const unlocked = [...prev.unlockedAchievements];
            let newPV = prev.pv || 0;
            
            if (prev.level >= 2 && !unlocked.includes('level_up')) {
                unlocked.push('level_up');
                newPV += 50;
            }
            if (prev.level >= 5 && !unlocked.includes('master')) {
                unlocked.push('master');
                newPV += 100;
            }
            
            if (unlocked.length === prev.unlockedAchievements.length) return prev;
            
            return { ...prev, unlockedAchievements: unlocked, pv: newPV };
        });
    }, []);

    const completeNode = useCallback((nodeId, score = 100) => {
        setProgress(prev => ({
            ...prev,
            [nodeId]: { status: 'completed', lastScore: score, timestamp: Date.now() }
        }));
        
        // Award PV for node completion
        awardPV(100, `Completed ${nodeId}`);
        checkStreak(); // Activity counts for streak
        
        logEvent('mastery', { nodeId, score });
    }, [logEvent, awardPV, checkStreak]);

    const resetProgress = useCallback(() => {
        setProgress({});
        setSessionLogs([]);
        setStudentProfile({ pv: 0, level: 1, streak: 0, lastActive: null, currency: 0, missions: [], unlockedAchievements: [] });
        localStorage.removeItem('ji_mastery_progress');
        localStorage.removeItem('ji_session_logs');
        localStorage.removeItem('ji_student_profile');
    }, []);

    // [NEW] Cognitive State Tracking
    const [cognitiveState, setCognitiveState] = useState({
        velocity: 0, // 0-100 Speed/Accuracy Index
        focus: 100, // 0-100 Attention Metric
        learningStyle: 'balanced', // 'visual', 'kinetic', 'verbal'
        recentErrors: [] // ['calc', 'logic', 'concept']
    });

    const updateCognitiveState = useCallback((metrics) => {
        // metrics: { timeSpent, score, errorType }
        setCognitiveState(prev => {
            // Calculate Velocity: Score weighted by Time (Faster + Accurate = Higher)
            const timeFactor = Math.max(0.1, 1 - (metrics.timeSpent / 600)); // Decay over 10 mins
            const sessionVelocity = metrics.score * timeFactor;
            
            // Rolling average (80% old, 20% new)
            const newVelocity = Math.round((prev.velocity * 0.8) + (sessionVelocity * 0.2));

            // Error Tracking
            const newErrors = metrics.errorType 
                ? [...prev.recentErrors, metrics.errorType].slice(-5) 
                : prev.recentErrors;

            return {
                ...prev,
                velocity: newVelocity,
                recentErrors: newErrors
            };
        });
    }, []);

    // [NEW] Assessment State
    const [assessmentState, setAssessmentState] = useState({
        status: 'pending', // 'pending', 'in_progress', 'completed'
        score: 0,
        path: null, 
        startNode: null,
        history: [] 
    });

    const updateAssessment = useCallback((result) => {
        setAssessmentState(prev => ({
            ...prev,
            status: 'completed',
            score: result.score,
            path: result.path,
            startNode: result.startNode,
            history: [...prev.history, { date: new Date().toISOString(), result }]
        }));
        logEvent('assessment_complete', result);
    }, [logEvent]);

    // [NEW] The Adaptive Algorithm
    const getRecommendedSession = useCallback(() => {
        // If assessment not done, recommend assessment, BUT provide a fallback node so other modes work!
        if (assessmentState.status !== 'completed') {
            const rootNode = CURRICULUM_DATA.nodes[CURRICULUM_DATA.rootNodeId];
            return {
                node: rootNode, // FALLBACK: Allow user to start at root if they skip assessment
                mode: 'assessment',
                rationale: "Let's find your starting point."
            };
        }

        // 1. Find next unlocked node
        const completedIds = Object.keys(progress).filter(k => progress[k].status === 'completed');
        const nextNodes = [];
        
        Object.values(CURRICULUM_DATA.nodes).forEach(node => {
            if (!completedIds.includes(node.id)) {
                const allPrereqsMet = node.prerequisites.every(id => completedIds.includes(id));
                if (allPrereqsMet) nextNodes.push(node);
            }
        });

        const targetNode = nextNodes.length > 0
            ? nextNodes[0]
            : (CURRICULUM_DATA.nodes[assessmentState.startNode] || CURRICULUM_DATA.nodes[CURRICULUM_DATA.rootNodeId]);

        return {
            node: targetNode,
            mode: assessmentState.path || 'train',
            rationale: `Continuing your ${assessmentState.path} journey starting with ${targetNode.title}.`
        };
    }, [progress, assessmentState]);

    const value = useMemo(() => ({
        progress,
        sessionLogs,
        studentProfile,
        cognitiveState,
        assessmentState, // [EXPORTED]
        notifications,
        awardPV,
        checkStreak,
        unlockAchievement,
        getNodeStatus,
        completeNode,
        setAvatarConfig,
        setTowerTag, // [EXPORTED]
        updateGameStats, // [EXPORTED]
        logEvent,
        resetProgress,
        updateCognitiveState,
        reportFailure, // [EXPORTED]
        reportSuccess, // [EXPORTED]
        updateAssessment, // [EXPORTED]
        getRecommendedSession,
        curriculum: CURRICULUM_DATA
    }), [progress, sessionLogs, studentProfile, cognitiveState, assessmentState, awardPV, checkStreak, getNodeStatus, completeNode, logEvent, resetProgress, updateCognitiveState, updateAssessment, getRecommendedSession]);

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
