import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CURRICULUM_DATA } from '../data/CurriculumData';

const MasteryContext = createContext(null);

export const MasteryProvider = ({ children }) => {
    // Progress shape: { [nodeId]: { status: 'locked' | 'unlocked' | 'completed', lastScore: 0 } }
    const [progress, setProgress] = useState(() => {
        const saved = localStorage.getItem('ji_mastery_progress');
        return saved ? JSON.parse(saved) : {};
    });

    // Logs shape: [{ id, type: 'frustration'|'mastery'|'session_start', timestamp, metadata }]
    const [sessionLogs, setSessionLogs] = useState(() => {
        const saved = localStorage.getItem('ji_session_logs');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('ji_mastery_progress', JSON.stringify(progress));
    }, [progress]);

    useEffect(() => {
        localStorage.setItem('ji_session_logs', JSON.stringify(sessionLogs));
    }, [sessionLogs]);

    const isNodeUnlocked = useCallback((nodeId) => {
        const node = CURRICULUM_DATA.nodes[nodeId];
        if (!node) return false;
        if (nodeId === CURRICULUM_DATA.rootNodeId) return true;

        const missingPrereq = node.prerequisites.some(prereqId => {
            const prereqStatus = progress[prereqId]?.status;
            return prereqStatus !== 'completed';
        });

        return !missingPrereq;
    }, [progress]);

    const getNodeStatus = useCallback((nodeId) => {
        if (progress[nodeId]?.status === 'completed') return 'completed';
        if (isNodeUnlocked(nodeId)) return 'unlocked';
        return 'locked';
    }, [progress, isNodeUnlocked]);

    const logEvent = useCallback((type, metadata = {}) => {
        const newLog = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            timestamp: Date.now(),
            type,
            metadata
        };
        setSessionLogs(prev => [newLog, ...prev]);
        console.log(`[MasteryLog] ${type}`, metadata);
    }, []);

    const completeNode = useCallback((nodeId, score = 100) => {
        setProgress(prev => ({
            ...prev,
            [nodeId]: { status: 'completed', lastScore: score, timestamp: Date.now() }
        }));
        logEvent('mastery', { nodeId, score });
    }, [logEvent]);

    const resetProgress = useCallback(() => {
        setProgress({});
        setSessionLogs([]);
        localStorage.removeItem('ji_mastery_progress');
        localStorage.removeItem('ji_session_logs');
    }, []);

    const value = useMemo(() => ({
        progress,
        sessionLogs,
        getNodeStatus,
        completeNode,
        logEvent,
        resetProgress,
        curriculum: CURRICULUM_DATA
    }), [progress, sessionLogs, getNodeStatus, completeNode, logEvent, resetProgress]);

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
