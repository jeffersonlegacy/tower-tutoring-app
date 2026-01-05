/**
 * MathMind.jsx - Math Skills Camp v3
 * 
 * COMPREHENSIVE MATH TUTOR: Elementary to College
 * - 15 skills across 4 categories
 * - XP bars and level progression
 * - Achievement popups
 * - Session summaries with insights
 * - 3-tier hint system
 * - Pattern-based teaching
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
    SKILLS, SKILL_ORDER, LEVELS, ACHIEVEMENTS, CATEGORIES,
    generateProblem, calculateNextDifficulty, isSkillUnlocked,
    getTeachingContent, generateSessionSummary, detectStrugglePatterns
} from './mathMind/adaptiveEngine';
import {
    getProfile, setActiveUser, getActiveUser, recordAttempt,
    updateSkillLevel, getAnalytics, getAvailableProfiles,
    getProblemHistory, unlockAchievement, checkAchievements, startSession
} from './mathMind/profileService';

// ═══════════════════════════════════════════════════════════════
// ANIMATIONS & STYLES
// ═══════════════════════════════════════════════════════════════
const styles = `
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pop { 0% { transform: scale(0.8); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
    @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 20px currentColor; } 50% { box-shadow: 0 0 40px currentColor; } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes xpFill { from { width: 0; } }
    @keyframes sparkle { 0% { transform: scale(0) rotate(0deg); opacity: 1; } 100% { transform: scale(1) rotate(180deg); opacity: 0; } }
    
    .slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
    .slide-down { animation: slideDown 0.4s ease-out; }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .pop { animation: pop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
    .shake { animation: shake 0.5s ease-out; }
    .glow { animation: glow 2s ease-in-out infinite; }
    .pulse { animation: pulse 1.5s ease-in-out infinite; }
    .float { animation: float 3s ease-in-out infinite; }
    .xp-fill { animation: xpFill 1s ease-out forwards; }
    
    .glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); }
    .glass-light { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
    
    .gradient-text { background: linear-gradient(135deg, #06b6d4, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .gradient-border { border-image: linear-gradient(135deg, #06b6d4, #8b5cf6) 1; }
`;

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

const XPBar = ({ current, max, level, color = 'cyan' }) => {
    const percent = Math.min((current / max) * 100, 100);
    return (
        <div className="relative h-3 bg-slate-900/50 rounded-full overflow-hidden border border-white/10">
            <div
                className={`h-full bg-gradient-to-r from-${color}-500 to-${color}-400 xp-fill`}
                style={{ width: `${percent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/80">
                {current}/{max} XP
            </div>
        </div>
    );
};

const AchievementPopup = ({ achievement, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 } });
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 slide-down">
            <div className="glass rounded-2xl p-4 flex items-center gap-4 shadow-2xl border-2 border-amber-500/50">
                <div className="text-4xl pop">{achievement.icon}</div>
                <div>
                    <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">Achievement Unlocked!</div>
                    <div className="text-lg font-black text-white">{achievement.name}</div>
                    <div className="text-xs text-slate-400">{achievement.desc}</div>
                </div>
            </div>
        </div>
    );
};

const SkillCard = ({ skill, stats, unlocked, onClick }) => {
    const level = LEVELS[stats?.level || 1];
    const nextLevel = LEVELS[(stats?.level || 1) + 1];
    const xpProgress = nextLevel ? stats?.xp || 0 : 0;
    const xpMax = nextLevel?.xpRequired || 100;

    return (
        <button
            onClick={() => unlocked && onClick()}
            disabled={!unlocked}
            className={`w-full p-4 rounded-2xl transition-all duration-300 ${unlocked
                ? `glass hover:bg-white/10 hover:scale-[1.02] hover:shadow-lg hover:shadow-${skill.color}-500/20`
                : 'bg-slate-900/30 opacity-40 cursor-not-allowed'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`text-4xl ${unlocked ? 'float' : 'grayscale'}`}>{skill.icon}</div>
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-white">{skill.name}</span>
                        {stats?.level >= 5 && <span className="text-amber-400">👑</span>}
                    </div>
                    <div className={`text-xs font-bold text-${skill.color}-400`}>
                        {unlocked ? `Level ${stats?.level || 1} • ${level.name}` : '🔒 Locked'}
                    </div>
                    {unlocked && stats && (
                        <div className="mt-2">
                            <XPBar current={xpProgress} max={xpMax} level={stats.level} color={skill.color} />
                        </div>
                    )}
                </div>
                {unlocked && stats && (
                    <div className="text-right">
                        <div className={`text-2xl font-black ${stats.accuracy >= 0.8 ? 'text-emerald-400' : stats.accuracy >= 0.6 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {Math.round((stats.accuracy || 0) * 100)}%
                        </div>
                        <div className="text-xs text-slate-500">{stats.total} done</div>
                    </div>
                )}
            </div>
        </button>
    );
};

const HintButton = ({ hints, onUseHint, usedHints }) => {
    const [showHint, setShowHint] = useState(false);
    const currentLevel = usedHints + 1;
    const hint = hints?.[usedHints];

    if (!hint || usedHints >= 3) return null;

    return (
        <div className="mt-4">
            {showHint ? (
                <div className="glass-light rounded-xl p-3 text-center slide-up">
                    <div className="text-sm text-cyan-400 mb-1">💡 Hint {currentLevel}</div>
                    <div className="text-white">{hint.text}</div>
                </div>
            ) : (
                <button
                    onClick={() => { setShowHint(true); onUseHint(); }}
                    className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                >
                    💡 Need a hint? ({3 - usedHints} left)
                </button>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════════════════════════

const LoginScreen = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [existingProfiles, setExistingProfiles] = useState([]);

    useEffect(() => {
        setExistingProfiles(getAvailableProfiles());
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 slide-up">
            <div className="text-7xl mb-4 float">🏕️</div>
            <h1 className="text-4xl font-black gradient-text mb-1">Math Skills Camp</h1>
            <p className="text-slate-400 text-sm mb-2">Elementary to College</p>
            <div className="flex gap-2 mb-6">
                <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">15 Skills</span>
                <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">Adaptive AI</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (username.trim()) onLogin(username.trim()); }} className="w-full max-w-xs space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your name..."
                        className="w-full px-5 py-4 glass rounded-2xl text-white text-center font-bold text-lg focus:ring-2 focus:ring-cyan-500/50 focus:outline-none placeholder:text-slate-600"
                        autoFocus
                    />
                </div>
                <button
                    type="submit"
                    disabled={!username.trim()}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl font-black text-lg text-white disabled:opacity-30 hover:shadow-lg hover:shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    🚀 START LEARNING
                </button>
            </form>

            {existingProfiles.length > 0 && (
                <div className="mt-8 w-full max-w-xs fade-in">
                    <div className="text-xs text-slate-600 mb-3 text-center">— or continue as —</div>
                    <div className="grid gap-2 max-h-36 overflow-y-auto">
                        {existingProfiles.slice(0, 4).map(p => (
                            <button
                                key={p.username}
                                onClick={() => onLogin(p.username)}
                                className="glass-light p-3 rounded-xl flex items-center justify-between hover:bg-white/10 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center font-black text-white">
                                        {p.username[0].toUpperCase()}
                                    </div>
                                    <span className="font-bold text-white">{p.username}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-amber-400 font-bold">{p.totalXP} XP</div>
                                    <div className="text-xs text-slate-500">{p.totalProblems} solved</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const DashboardScreen = ({ profile, analytics, onSelectSkill, onLogout }) => {
    const welcomeMessages = ['Ready to learn?', 'Let\'s grow!', 'You\'re doing great!', 'Keep pushing!'];
    const welcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

    return (
        <div className="flex flex-col h-full p-4 overflow-y-auto slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="text-2xl font-black text-white">Hey, {profile.username}! 👋</div>
                    <div className="text-sm text-slate-400">{welcome}</div>
                </div>
                <button onClick={onLogout} className="text-xs text-slate-600 hover:text-white transition-colors">
                    Switch
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="glass rounded-2xl p-4 text-center">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">
                        {analytics.totalXP}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Total XP</div>
                </div>
                <div className="glass rounded-2xl p-4 text-center">
                    <div className="text-3xl font-black text-amber-400">
                        🔥 {analytics.currentStreak}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Streak</div>
                </div>
                <div className="glass rounded-2xl p-4 text-center">
                    <div className={`text-3xl font-black ${analytics.overallAccuracy >= 80 ? 'text-emerald-400' : analytics.overallAccuracy >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {analytics.overallAccuracy}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Accuracy</div>
                </div>
            </div>

            {/* Achievements Preview */}
            {analytics.achievementCount > 0 && (
                <div className="glass-light rounded-xl p-3 mb-6 flex items-center gap-3">
                    <div className="text-2xl">🏆</div>
                    <div>
                        <div className="text-sm font-bold text-white">{analytics.achievementCount} Achievements</div>
                        <div className="text-xs text-slate-500">Keep playing to unlock more!</div>
                    </div>
                </div>
            )}

            {/* Skills by Category */}
            {Object.entries(CATEGORIES).sort((a, b) => a[1].order - b[1].order).map(([categoryName, categoryInfo]) => {
                const categorySkills = SKILL_ORDER.filter(id => SKILLS[id]?.category === categoryName);
                if (categorySkills.length === 0) return null;

                return (
                    <div key={categoryName} className="mb-4">
                        <div className={`flex items-center gap-2 mb-2 text-${categoryInfo.color}-400`}>
                            <span>{categoryInfo.icon}</span>
                            <span className="text-xs font-bold uppercase tracking-wider">{categoryName}</span>
                        </div>
                        <div className="grid gap-2">
                            {categorySkills.map(skillId => (
                                <SkillCard
                                    key={skillId}
                                    skill={SKILLS[skillId]}
                                    stats={profile.skills[skillId]}
                                    unlocked={isSkillUnlocked(skillId, profile)}
                                    onClick={() => onSelectSkill(skillId)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const PracticeScreen = ({ profile, skillId, onBack, onTeach, onUpdateProfile }) => {
    const [problem, setProblem] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const startTime = useRef(Date.now());

    const skill = SKILLS[skillId];
    const stats = profile.skills[skillId];
    const level = LEVELS[stats?.level || 1];

    useEffect(() => { loadNewProblem(); }, [skillId]);

    const loadNewProblem = useCallback(() => {
        const history = getProblemHistory(profile.username, 20);
        const newProblem = generateProblem(skillId, stats?.level || 1, history);
        setProblem(newProblem);
        setFeedback(null);
        setHintsUsed(0);
        startTime.current = Date.now();
    }, [skillId, stats?.level, profile.username]);

    const handleAnswer = (selected) => {
        if (feedback) return;

        const isCorrect = selected === problem.answer;
        const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

        // Record with full data
        const updatedProfile = recordAttempt(profile.username, {
            skillId,
            correct: isCorrect,
            timeSpent,
            xpReward: isCorrect ? problem.xpReward || 5 : 0,
            problem: problem.problem,
            answer: problem.answer,
            userAnswer: selected
        });

        onUpdateProfile(updatedProfile);

        const historyEntry = { ...problem, correct: isCorrect, timeSpent, userAnswer: selected };
        setSessionHistory(h => [...h, historyEntry]);

        if (isCorrect) {
            setFeedback('correct');
            confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });

            // Check for level up
            const adjustment = calculateNextDifficulty(
                { ...stats, correct: stats.correct + 1, streak: stats.streak + 1, xp: (stats.xp || 0) + (problem.xpReward || 5) },
                getProblemHistory(profile.username),
                skill.levels
            );

            if (adjustment.action === 'LEVEL_UP') {
                updateSkillLevel(profile.username, skillId, adjustment.newLevel);
                confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
            }

            setTimeout(loadNewProblem, 1200);
        } else {
            setFeedback('wrong');

            const adjustment = calculateNextDifficulty(
                { ...stats, streak: stats.streak - 1 },
                getProblemHistory(profile.username),
                skill.levels
            );

            if (adjustment.action === 'TEACH') {
                setTimeout(() => onTeach(skillId, adjustment.patterns || []), 2500);
            } else {
                setTimeout(loadNewProblem, 2500);
            }
        }
    };

    const handleEndSession = () => {
        setShowSummary(true);
    };

    if (showSummary) {
        const summary = generateSessionSummary(sessionHistory, profile);
        return (
            <div className="flex flex-col h-full p-6 items-center justify-center slide-up">
                <div className="text-5xl mb-4">{summary.accuracy >= 80 ? '🌟' : summary.accuracy >= 60 ? '👍' : '💪'}</div>
                <h2 className="text-2xl font-black text-white mb-2">Session Complete!</h2>
                <p className="text-slate-400 mb-6">{summary.encouragement}</p>

                <div className="glass rounded-2xl p-6 w-full max-w-sm mb-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-3xl font-black text-white">{summary.problemsSolved}</div>
                            <div className="text-xs text-slate-500">Problems</div>
                        </div>
                        <div>
                            <div className={`text-3xl font-black ${summary.accuracy >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {summary.accuracy}%
                            </div>
                            <div className="text-xs text-slate-500">Accuracy</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-amber-400">+{summary.xpEarned}</div>
                            <div className="text-xs text-slate-500">XP Earned</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-cyan-400">{summary.avgTime}s</div>
                            <div className="text-xs text-slate-500">Avg Time</div>
                        </div>
                    </div>

                    {summary.patterns.length > 0 && (
                        <div className="mt-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                            <div className="text-xs text-amber-400 font-bold mb-1">💡 Tip</div>
                            <div className="text-sm text-white">{summary.patterns[0].message}</div>
                        </div>
                    )}
                </div>

                <button
                    onClick={onBack}
                    className="w-full max-w-sm py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl font-black text-white"
                >
                    Back to Skills
                </button>
            </div>
        );
    }

    if (!problem) return null;

    return (
        <div className="flex flex-col h-full p-4">
            <style>{styles}</style>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={handleEndSession} className="text-sm text-slate-500 hover:text-white">← End</button>
                <div className="text-center">
                    <div className="flex items-center gap-2 justify-center">
                        <span className="text-xl">{skill.icon}</span>
                        <span className="font-bold text-white">{skill.name}</span>
                    </div>
                    <div className={`text-xs text-${skill.color}-400`}>Level {stats?.level || 1} • {level.name}</div>
                </div>
                <div className="text-sm">
                    <span className="text-emerald-400">✓{sessionHistory.filter(h => h.correct).length}</span>
                    {' / '}
                    <span className="text-rose-400">✗{sessionHistory.filter(h => !h.correct).length}</span>
                </div>
            </div>

            {/* XP Progress */}
            <div className="mb-6">
                <XPBar
                    current={stats?.xp || 0}
                    max={LEVELS[(stats?.level || 1) + 1]?.xpRequired || 100}
                    level={stats?.level}
                    color={skill.color}
                />
            </div>

            {/* Problem */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className={`text-center mb-8 glass rounded-3xl p-8 w-full max-w-md transition-all ${feedback === 'correct' ? 'border-2 border-emerald-500 pop' :
                    feedback === 'wrong' ? 'border-2 border-rose-500 shake' : ''
                    }`}>
                    {problem.visual && !feedback && (
                        <div className="text-lg text-slate-400 mb-4">{problem.visual}</div>
                    )}

                    <div className="text-4xl font-black text-white mb-2">
                        {problem.equation || problem.problem}
                    </div>

                    {problem.equation && (
                        <div className="text-sm text-slate-400">{problem.problem}</div>
                    )}

                    {feedback === 'correct' && (
                        <div className="mt-4 text-emerald-400 font-bold text-xl slide-up">
                            ✓ Correct! +{problem.xpReward || 5} XP
                        </div>
                    )}

                    {feedback === 'wrong' && (
                        <div className="mt-4 slide-up">
                            <div className="text-rose-400 font-bold">✗ Not quite</div>
                            <div className="text-sm text-slate-400 mt-1">
                                The answer was <span className="text-emerald-400 font-bold">{problem.answer}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Answer Options */}
                {!feedback && (
                    <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                        {problem.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleAnswer(opt)}
                                className="py-5 glass rounded-2xl font-black text-2xl text-white hover:bg-white/10 hover:scale-[1.03] transition-all active:scale-[0.97]"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}

                {/* Hints */}
                {!feedback && problem.hints && (
                    <HintButton
                        hints={problem.hints}
                        usedHints={hintsUsed}
                        onUseHint={() => setHintsUsed(h => h + 1)}
                    />
                )}
            </div>

            {/* Streak */}
            <div className="text-center text-sm">
                {stats?.streak > 0 && (
                    <span className="text-amber-400 font-bold pulse">🔥 {stats.streak} in a row!</span>
                )}
            </div>
        </div>
    );
};

const TeachingScreen = ({ profile, skillId, patterns, onBack, onPractice }) => {
    const [step, setStep] = useState(0);
    const content = getTeachingContent(skillId, profile, patterns);

    if (!content) return null;

    const currentStep = content.steps[step];
    const isLast = step >= content.steps.length - 1;

    return (
        <div className="flex flex-col h-full p-6 slide-up">
            <style>{styles}</style>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="text-sm text-slate-500 hover:text-white">← Skip</button>
                <div className="text-5xl float">{content.icon}</div>
                <div className="text-sm text-slate-500">{step + 1}/{content.steps.length}</div>
            </div>

            <h1 className="text-2xl font-black text-white text-center mb-6">{content.title}</h1>

            {/* Personal connection */}
            {content.personalMessage && step === 0 && (
                <div className="glass-light rounded-2xl p-4 mb-6 text-center border border-cyan-500/30 fade-in">
                    <div className="text-cyan-400 font-bold mb-1">💡 You already know this!</div>
                    <div className="text-sm text-slate-300">{content.personalMessage}</div>
                </div>
            )}

            {/* Pattern advice */}
            {content.personalAdvice?.length > 0 && step === 0 && (
                <div className="glass-light rounded-2xl p-4 mb-6 border border-amber-500/30 fade-in">
                    <div className="text-amber-400 font-bold text-sm mb-1">🎯 Personalized Tip</div>
                    <div className="text-sm text-white">{content.personalAdvice[0]}</div>
                </div>
            )}

            {/* Teaching content */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="glass rounded-3xl p-8 max-w-sm text-center slide-up" key={step}>
                    <div className="text-xl text-white mb-4">{currentStep.text}</div>
                    {currentStep.visual && (
                        <div className="text-3xl tracking-widest">{currentStep.visual}</div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
                {step > 0 && (
                    <button
                        onClick={() => setStep(s => s - 1)}
                        className="flex-1 py-4 glass rounded-2xl font-bold text-white hover:bg-white/10"
                    >
                        ← Back
                    </button>
                )}
                <button
                    onClick={() => isLast ? onPractice() : setStep(s => s + 1)}
                    className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl font-black text-white hover:shadow-lg hover:shadow-cyan-500/30"
                >
                    {isLast ? "Let's Practice! 🚀" : 'Next →'}
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function MathMind({ onBack }) {
    const [screen, setScreen] = useState('login');
    const [username, setUsername] = useState(getActiveUser());
    const [profile, setProfile] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [teachPatterns, setTeachPatterns] = useState([]);
    const [newAchievement, setNewAchievement] = useState(null);

    useEffect(() => {
        if (username) {
            const p = getProfile(username);
            setProfile(p);
            setActiveUser(username);
            startSession(username);
            setScreen('dashboard');

            // Check achievements
            const newAchievements = checkAchievements(p);
            if (newAchievements.length > 0) {
                unlockAchievement(username, newAchievements[0]);
                setNewAchievement(ACHIEVEMENTS[newAchievements[0]]);
            }
        } else {
            setScreen('login');
        }
    }, [username]);

    useEffect(() => {
        if (profile) {
            const newAchievements = checkAchievements(profile);
            if (newAchievements.length > 0) {
                unlockAchievement(profile.username, newAchievements[0]);
                setNewAchievement(ACHIEVEMENTS[newAchievements[0]]);
            }
        }
    }, [profile?.stats?.currentStreak, profile?.stats?.totalProblems]);

    const handleLogin = (name) => setUsername(name);
    const handleLogout = () => { setActiveUser(null); setUsername(null); setProfile(null); setScreen('login'); };
    const handleSelectSkill = (id) => { setSelectedSkill(id); setScreen('practice'); };
    const handleTeach = (id, patterns = []) => { setSelectedSkill(id); setTeachPatterns(patterns); setScreen('teaching'); };
    const handleBackToDashboard = () => { setSelectedSkill(null); setScreen('dashboard'); if (username) setProfile(getProfile(username)); };

    const analytics = profile ? getAnalytics(username) : null;

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
            <style>{styles}</style>

            {/* Achievement popup */}
            {newAchievement && (
                <AchievementPopup achievement={newAchievement} onClose={() => setNewAchievement(null)} />
            )}

            {/* Compact header */}
            {screen !== 'login' && (
                <div className="shrink-0 p-3 flex items-center justify-between glass border-0 border-b border-white/5">
                    <button onClick={onBack} className="text-xs text-slate-500 hover:text-white">← EXIT</button>
                    <div className="text-sm font-black gradient-text">🏕️ Math Skills Camp</div>
                    {analytics && (
                        <div className="text-xs text-amber-400 font-bold">{analytics.totalXP} XP</div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
                {screen === 'dashboard' && profile && analytics && (
                    <DashboardScreen profile={profile} analytics={analytics} onSelectSkill={handleSelectSkill} onLogout={handleLogout} />
                )}
                {screen === 'practice' && profile && selectedSkill && (
                    <PracticeScreen profile={profile} skillId={selectedSkill} onBack={handleBackToDashboard} onTeach={handleTeach} onUpdateProfile={setProfile} />
                )}
                {screen === 'teaching' && profile && selectedSkill && (
                    <TeachingScreen profile={profile} skillId={selectedSkill} patterns={teachPatterns} onBack={handleBackToDashboard} onPractice={() => setScreen('practice')} />
                )}
            </div>
        </div>
    );
}
