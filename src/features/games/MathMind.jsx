/**
 * MathMind.jsx - Math Skills Camp v4
 * 
 * MAJOR IMPROVEMENTS FROM CRITICAL REVIEW:
 * - All skills unlocked (no artificial gates)
 * - Step-by-step explanations for wrong answers
 * - Teaching triggers after just 2 wrong
 * - Professional UI (less emoji, more substance)
 * - Grade-level categories
 * - Immediate corrective feedback
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
    SKILLS, SKILL_ORDER, LEVELS, CATEGORIES,
    generateProblem, calculateNextDifficulty, isSkillUnlocked,
    getTeachingContent, generateSessionSummary
} from './mathMind/adaptiveEngine';
import {
    getProfile, setActiveUser, getActiveUser, recordAttempt,
    updateSkillLevel, getAnalytics, getAvailableProfiles,
    getProblemHistory, startSession
} from './mathMind/profileService';

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = `
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pop { 0% { transform: scale(0.9); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
    @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    @keyframes correct { from { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); } to { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); } }
    
    .slide-up { animation: slideUp 0.4s ease-out; }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .pop { animation: pop 0.3s ease-out; }
    .shake { animation: shake 0.4s ease-out; }
    .pulse { animation: pulse 1.5s infinite; }
    .correct-glow { animation: correct 0.5s ease-out; }
    
    .glass { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); }
    .glass-light { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.05); }
    
    .gradient-text { background: linear-gradient(135deg, #10b981, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
`;

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

const XPBar = ({ current, max, color = 'emerald' }) => {
    const percent = max > 0 ? Math.min((current / max) * 100, 100) : 0;
    return (
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full bg-${color}-500 transition-all duration-500`} style={{ width: `${percent}%` }} />
        </div>
    );
};

const SkillCard = ({ skill, stats, onClick }) => {
    const level = LEVELS[stats?.level || 1];
    const nextLevel = LEVELS[(stats?.level || 1) + 1];
    const xp = stats?.xp || 0;
    const xpMax = nextLevel?.xpRequired || 100;
    const accuracy = stats?.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    const currentStandards = skill.standards?.[stats?.level || 1] || [];

    return (
        <button
            onClick={onClick}
            className="w-full p-3 rounded-xl glass hover:bg-white/5 transition-all group text-left"
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${skill.color}-500/20 flex items-center justify-center text-${skill.color}-400 font-bold text-lg`}>
                    {skill.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">{skill.name}</span>
                        {stats?.total > 0 && (
                            <span className={`text-xs font-bold ${accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-amber-400' : 'text-slate-500'}`}>
                                {accuracy}%
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs text-${skill.color}-400`}>Lv{stats?.level || 1}</span>
                        <span className="text-[9px] text-slate-600">•</span>
                        <span className="text-[9px] text-slate-500">{skill.gradeRange}</span>
                        {currentStandards.length > 0 && (
                            <span className="text-[9px] text-cyan-600 font-mono">{currentStandards[0]}</span>
                        )}
                    </div>
                    <div className="mt-1">
                        <XPBar current={xp} max={xpMax} color={skill.color} />
                    </div>
                </div>
                <div className="text-slate-600 group-hover:text-slate-400 transition-colors">→</div>
            </div>
        </button>
    );
};


const StepByStepExplanation = ({ problem, onContinue }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const steps = problem.steps || [problem.explanation || `The answer is ${problem.answer}`];
    const isLast = stepIndex >= steps.length - 1;

    return (
        <div className="slide-up space-y-4">
            <div className="text-center">
                <div className="text-rose-400 font-bold mb-2">✗ Not quite</div>
                <div className="text-2xl font-bold text-white mb-1">{problem.problem}</div>
                <div className="text-emerald-400 font-bold">Answer: {problem.answer}</div>
            </div>

            <div className="glass rounded-xl p-4">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                    Step {stepIndex + 1} of {steps.length}
                </div>
                <div className="text-white text-lg" key={stepIndex}>
                    {typeof steps[stepIndex] === 'string' ? steps[stepIndex] : steps[stepIndex]?.text || steps[stepIndex]}
                </div>
            </div>

            <div className="flex gap-2">
                {stepIndex > 0 && (
                    <button
                        onClick={() => setStepIndex(s => s - 1)}
                        className="flex-1 py-3 glass rounded-xl font-semibold text-white hover:bg-white/10"
                    >
                        ← Back
                    </button>
                )}
                <button
                    onClick={() => isLast ? onContinue() : setStepIndex(s => s + 1)}
                    className={`flex-1 py-3 rounded-xl font-bold text-white ${isLast ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                >
                    {isLast ? 'Continue →' : 'Next Step'}
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════════════════════════

const LoginScreen = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [profiles] = useState(getAvailableProfiles());

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 slide-up">
            <div className="text-center mb-6">
                <div className="text-5xl mb-3">📐</div>
                <h1 className="text-3xl font-bold gradient-text">Math Skills Camp</h1>
                <p className="text-slate-500 text-sm mt-1">Grades K-12 and Beyond</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (username.trim()) onLogin(username.trim()); }} className="w-full max-w-xs space-y-3">
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-4 glass rounded-xl text-white text-center font-medium text-base md:text-lg focus:ring-2 focus:ring-emerald-500/50 focus:outline-none placeholder:text-slate-600 appearance-none"
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={!username.trim()}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white disabled:opacity-30 transition-all"
                >
                    Start Learning
                </button>
            </form>

            {profiles.length > 0 && (
                <div className="mt-6 w-full max-w-xs">
                    <div className="text-xs text-slate-600 text-center mb-2">Recent</div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {profiles.slice(0, 3).map(p => (
                            <button
                                key={p.username}
                                onClick={() => onLogin(p.username)}
                                className="w-full glass-light p-2 rounded-lg flex items-center justify-between hover:bg-white/5"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                                        {p.username[0].toUpperCase()}
                                    </div>
                                    <span className="text-white text-sm">{p.username}</span>
                                </div>
                                <span className="text-xs text-amber-400">{p.totalXP} XP</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const DashboardScreen = ({ profile, analytics, onSelectSkill, onLogout }) => {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-lg font-bold text-white">{profile.username}</div>
                        <div className="text-xs text-slate-500">{analytics.totalProblems} problems solved</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-lg font-bold text-amber-400">{analytics.totalXP}</div>
                            <div className="text-[10px] text-slate-600 uppercase">XP</div>
                        </div>
                        <button onClick={onLogout} className="text-xs text-slate-600 hover:text-slate-400">↻</button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="glass-light rounded-lg p-2 text-center">
                        <div className={`text-lg font-bold ${analytics.overallAccuracy >= 80 ? 'text-emerald-400' : analytics.overallAccuracy >= 60 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {analytics.overallAccuracy}%
                        </div>
                        <div className="text-[9px] text-slate-600 uppercase">Accuracy</div>
                    </div>
                    <div className="glass-light rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-orange-400">{analytics.currentStreak}</div>
                        <div className="text-[9px] text-slate-600 uppercase">Streak</div>
                    </div>
                    <div className="glass-light rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-purple-400">{analytics.skillsStarted}</div>
                        <div className="text-[9px] text-slate-600 uppercase">Skills</div>
                    </div>
                </div>
            </div>

            {/* Skills List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {Object.entries(CATEGORIES).sort((a, b) => a[1].order - b[1].order).map(([categoryName, categoryInfo]) => {
                    const categorySkills = SKILL_ORDER.filter(id => SKILLS[id]?.category === categoryName);
                    if (categorySkills.length === 0) return null;

                    return (
                        <div key={categoryName}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-${categoryInfo.color}-500/20 text-${categoryInfo.color}-400`}>
                                    {categoryInfo.icon}
                                </span>
                                <span className="text-xs font-semibold text-slate-400">{categoryName}</span>
                                <span className="text-[10px] text-slate-600">{categoryInfo.grades}</span>
                            </div>
                            <div className="space-y-2">
                                {categorySkills.map(skillId => (
                                    <SkillCard
                                        key={skillId}
                                        skill={SKILLS[skillId]}
                                        stats={profile.skills[skillId]}
                                        onClick={() => onSelectSkill(skillId)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PracticeScreen = ({ profile, skillId, onBack, onTeach, onUpdateProfile }) => {
    const [problem, setProblem] = useState(null);
    const [feedback, setFeedback] = useState(null); // null | 'correct' | 'wrong'
    const [showExplanation, setShowExplanation] = useState(false);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [showSummary, setShowSummary] = useState(false);
    const startTime = useRef(Date.now());

    const skill = SKILLS[skillId];
    const stats = profile.skills[skillId];

    useEffect(() => { loadNewProblem(); }, [skillId]);

    const loadNewProblem = useCallback(() => {
        const newProblem = generateProblem(skillId, stats?.level || 1);
        setProblem(newProblem);
        setFeedback(null);
        setShowExplanation(false);
        startTime.current = Date.now();
    }, [skillId, stats?.level]);

    const handleAnswer = (selected) => {
        if (feedback) return;

        const isCorrect = selected === problem.answer;
        const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

        const updatedProfile = recordAttempt(profile.username, {
            skillId,
            correct: isCorrect,
            timeSpent,
            xpReward: isCorrect ? problem.xpReward || 10 : 0,
            problem: problem.problem,
            answer: problem.answer,
            userAnswer: selected
        });
        onUpdateProfile(updatedProfile);

        const historyEntry = { ...problem, correct: isCorrect, timeSpent, userAnswer: selected };
        setSessionHistory(h => [...h, historyEntry]);

        if (isCorrect) {
            setFeedback('correct');
            confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });

            const adjustment = calculateNextDifficulty(
                { ...stats, correct: (stats?.correct || 0) + 1, streak: (stats?.streak || 0) + 1, xp: (stats?.xp || 0) + (problem.xpReward || 10) },
                getProblemHistory(profile.username),
                skill.levels
            );

            if (adjustment.action === 'LEVEL_UP') {
                updateSkillLevel(profile.username, skillId, adjustment.newLevel);
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            }

            setTimeout(loadNewProblem, 1000);
        } else {
            setFeedback('wrong');
            setShowExplanation(true);

            // Check if we should trigger teaching (after 2 wrong)
            const recentWrong = [...sessionHistory, historyEntry].filter(h => !h.correct).length;
            if (recentWrong >= 2 && recentWrong % 2 === 0) {
                // After explanation, go to teaching
                setTimeout(() => onTeach(skillId), 100);
            }
        }
    };

    const handleContinueFromExplanation = () => {
        setShowExplanation(false);
        setFeedback(null);
        loadNewProblem();
    };

    const handleEndSession = () => setShowSummary(true);

    // Session Summary
    if (showSummary) {
        const summary = generateSessionSummary(sessionHistory, profile);
        return (
            <div className="flex flex-col h-full p-6 items-center justify-center slide-up">
                <div className="text-4xl mb-3">{summary.accuracy >= 80 ? '🎯' : summary.accuracy >= 60 ? '📈' : '💪'}</div>
                <h2 className="text-2xl font-bold text-white mb-1">Session Complete</h2>
                <p className="text-slate-500 mb-4">{summary.encouragement}</p>

                <div className="glass rounded-2xl p-6 w-full max-w-xs mb-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-3xl font-bold text-white">{summary.problemsSolved}</div>
                            <div className="text-xs text-slate-500">Problems</div>
                        </div>
                        <div>
                            <div className={`text-3xl font-bold ${summary.accuracy >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {summary.accuracy}%
                            </div>
                            <div className="text-xs text-slate-500">Accuracy</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-amber-400">+{summary.xpEarned}</div>
                            <div className="text-xs text-slate-500">XP Earned</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-blue-400">{summary.avgTime}s</div>
                            <div className="text-xs text-slate-500">Avg Time</div>
                        </div>
                    </div>

                    {/* CA Standards Covered */}
                    {summary.standardsCovered?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">CA Standards Practiced</div>
                            <div className="flex flex-wrap gap-1">
                                {summary.standardsCovered.slice(0, 4).map(std => (
                                    <span key={std} className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                        {std}
                                    </span>
                                ))}
                                {summary.standardsCovered.length > 4 && (
                                    <span className="text-[9px] text-slate-600">+{summary.standardsCovered.length - 4} more</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={onBack} className="w-full max-w-xs py-3 bg-emerald-600 rounded-xl font-bold text-white">
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
            <div className="flex items-center justify-between mb-3">
                <button onClick={handleEndSession} className="text-sm text-slate-500 hover:text-white">← End</button>
                <div className="text-center">
                    <div className="flex items-center gap-2 justify-center">
                        <span className={`w-6 h-6 rounded bg-${skill.color}-500/20 text-${skill.color}-400 flex items-center justify-center text-sm font-bold`}>
                            {skill.icon}
                        </span>
                        <span className="font-semibold text-white">{skill.name}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                        <span className="text-xs text-slate-500">Level {stats?.level || 1}</span>
                        {problem?.standards?.[0] && (
                            <span className="text-[9px] font-mono text-cyan-500">{problem.standards[0]}</span>
                        )}
                    </div>
                </div>
                <div className="text-sm">
                    <span className="text-emerald-400">{sessionHistory.filter(h => h.correct).length}</span>
                    <span className="text-slate-600"> / </span>
                    <span className="text-rose-400">{sessionHistory.filter(h => !h.correct).length}</span>
                </div>
            </div>

            {/* XP Progress */}
            <div className="mb-4">
                <XPBar current={stats?.xp || 0} max={LEVELS[(stats?.level || 1) + 1]?.xpRequired || 100} color={skill.color} />
            </div>

            {/* Problem Area */}
            <div className="flex-1 flex flex-col items-center justify-center">
                {showExplanation && feedback === 'wrong' ? (
                    <StepByStepExplanation problem={problem} onContinue={handleContinueFromExplanation} />
                ) : (
                    <>
                        {/* Problem Card */}
                        <div className={`glass rounded-2xl p-6 w-full max-w-md text-center mb-6 transition-all ${feedback === 'correct' ? 'border-2 border-emerald-500 correct-glow' :
                            feedback === 'wrong' ? 'border-2 border-rose-500 shake' : ''
                            }`}>
                            <div className="text-3xl font-bold text-white mb-2">
                                {problem.equation || problem.problem}
                            </div>

                            {feedback === 'correct' && (
                                <div className="text-emerald-400 font-bold text-lg mt-3 pop">
                                    ✓ Correct! +{problem.xpReward || 10} XP
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
                                        className="py-4 glass rounded-xl font-bold text-xl text-white hover:bg-white/10 hover:scale-[1.02] transition-all active:scale-[0.98]"
                                    >
                                        {typeof opt === 'number' ? (Number.isInteger(opt) ? opt : opt.toFixed(2)) : opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Hint */}
                        {!feedback && problem.hint && (
                            <div className="mt-4 text-xs text-slate-500 text-center">
                                💡 Hint: {problem.hint}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Streak */}
            {stats?.streak > 0 && !showExplanation && (
                <div className="text-center text-sm text-amber-400 font-bold pulse">
                    {stats.streak} in a row!
                </div>
            )}
        </div>
    );
};

const TeachingScreen = ({ skillId, onBack, onPractice }) => {
    const [step, setStep] = useState(0);
    const content = getTeachingContent(skillId);
    const skill = SKILLS[skillId];

    const currentStep = content.steps?.[step] || { text: 'Let\'s practice!' };
    const isLast = step >= (content.steps?.length || 1) - 1;

    return (
        <div className="flex flex-col h-full p-6 slide-up">
            <style>{styles}</style>

            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="text-sm text-slate-500 hover:text-white">← Skip</button>
                <div className={`w-12 h-12 rounded-xl bg-${skill.color}-500/20 flex items-center justify-center text-${skill.color}-400 text-2xl font-bold`}>
                    {skill.icon}
                </div>
                <div className="text-sm text-slate-500">{step + 1}/{content.steps?.length || 1}</div>
            </div>

            <h1 className="text-xl font-bold text-white text-center mb-2">{content.title}</h1>
            <p className="text-sm text-slate-500 text-center mb-6">{skill.description}</p>

            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="glass rounded-2xl p-6 max-w-sm text-center">
                    <div className="text-lg text-white mb-3">{currentStep.text}</div>
                    {currentStep.visual && (
                        <div className="font-mono text-xl text-amber-400 bg-slate-900/50 rounded-lg p-3 whitespace-pre-wrap">
                            {currentStep.visual}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-3">
                {step > 0 && (
                    <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3 glass rounded-xl font-semibold text-white">
                        ← Back
                    </button>
                )}
                <button
                    onClick={() => isLast ? onPractice() : setStep(s => s + 1)}
                    className="flex-1 py-3 bg-emerald-600 rounded-xl font-bold text-white"
                >
                    {isLast ? "Practice →" : "Next"}
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

    useEffect(() => {
        if (username) {
            const p = getProfile(username);
            setProfile(p);
            setActiveUser(username);
            startSession(username);
            setScreen('dashboard');
        } else {
            setScreen('login');
        }
    }, [username]);

    const handleLogin = (name) => setUsername(name);
    const handleLogout = () => { setActiveUser(null); setUsername(null); setProfile(null); setScreen('login'); };
    const handleSelectSkill = (id) => { setSelectedSkill(id); setScreen('practice'); };
    const handleTeach = (id) => { setSelectedSkill(id); setScreen('teaching'); };
    const handleBackToDashboard = () => { setSelectedSkill(null); setScreen('dashboard'); if (username) setProfile(getProfile(username)); };

    const analytics = profile ? getAnalytics(username) : null;

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
            <style>{styles}</style>

            {/* Header */}
            {screen !== 'login' && (
                <div className="shrink-0 px-4 py-2 flex items-center justify-between border-b border-white/5 bg-slate-900/50">
                    <button onClick={onBack} className="text-xs text-slate-600 hover:text-white">← Exit</button>
                    <div className="text-sm font-bold gradient-text">Math Skills Camp</div>
                    {analytics && <div className="text-xs text-amber-400 font-bold">{analytics.totalXP} XP</div>}
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
                {screen === 'teaching' && selectedSkill && (
                    <TeachingScreen skillId={selectedSkill} onBack={handleBackToDashboard} onPractice={() => setScreen('practice')} />
                )}
            </div>
        </div>
    );
}
