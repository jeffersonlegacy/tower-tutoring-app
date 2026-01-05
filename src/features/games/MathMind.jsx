/**
 * MathMind.jsx - AI-Powered Adaptive Math Tutor
 * 
 * Features:
 * - Username-based progress tracking
 * - Adaptive difficulty (Zone of Proximal Development)
 * - Teaching moments with prior knowledge connections
 * - Visual feedback and animations
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
    SKILLS,
    SKILL_ORDER,
    LEVELS,
    generateProblem,
    calculateNextDifficulty,
    isSkillUnlocked,
    getTeachingContent
} from './mathMind/adaptiveEngine';
import {
    getProfile,
    setActiveUser,
    getActiveUser,
    recordAttempt,
    updateSkillLevel,
    getAnalytics,
    getAvailableProfiles
} from './mathMind/profileService';

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = `
    @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
    @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 10px currentColor; } 50% { box-shadow: 0 0 25px currentColor; } }
    .slide-in { animation: slideIn 0.4s ease-out; }
    .pop { animation: pop 0.3s ease-out; }
    .shake { animation: shake 0.4s ease-out; }
    .glow { animation: glow 1.5s ease-in-out infinite; }
`;

// ═══════════════════════════════════════════════════════════════
// SCREEN: LOGIN
// ═══════════════════════════════════════════════════════════════
const LoginScreen = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [existingProfiles, setExistingProfiles] = useState([]);

    useEffect(() => {
        setExistingProfiles(getAvailableProfiles());
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) onLogin(username.trim());
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 slide-in">
            <div className="text-6xl mb-4">🧠</div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                MathMind
            </h1>
            <p className="text-slate-400 text-sm mb-8">Your AI Math Tutor</p>

            <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-center font-bold focus:border-cyan-500 focus:outline-none"
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={!username.trim()}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-black text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
                >
                    START LEARNING
                </button>
            </form>

            {existingProfiles.length > 0 && (
                <div className="mt-8 w-full max-w-xs">
                    <div className="text-xs text-slate-500 mb-2">CONTINUE AS:</div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {existingProfiles.slice(0, 5).map(p => (
                            <button
                                key={p.username}
                                onClick={() => onLogin(p.username)}
                                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg flex items-center justify-between hover:border-cyan-500/50"
                            >
                                <span className="font-bold text-sm">{p.username}</span>
                                <span className="text-xs text-slate-500">{p.totalProblems} problems</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// SCREEN: DASHBOARD
// ═══════════════════════════════════════════════════════════════
const DashboardScreen = ({ profile, analytics, onSelectSkill, onLogout }) => {
    return (
        <div className="flex flex-col h-full p-4 overflow-y-auto slide-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="text-2xl font-black text-white">Hi, {profile.username}!</div>
                    <div className="text-sm text-slate-400">🔥 {analytics.currentStreak} streak</div>
                </div>
                <button onClick={onLogout} className="text-xs text-slate-500 hover:text-white">
                    Switch User
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
                    <div className="text-2xl font-black text-cyan-400">{analytics.totalProblems}</div>
                    <div className="text-xs text-slate-500">Problems</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
                    <div className="text-2xl font-black text-emerald-400">{analytics.overallAccuracy}%</div>
                    <div className="text-xs text-slate-500">Accuracy</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
                    <div className="text-2xl font-black text-amber-400">{analytics.masteredSkills}/{analytics.totalSkills}</div>
                    <div className="text-xs text-slate-500">Mastered</div>
                </div>
            </div>

            {/* Skills */}
            <div className="text-xs text-slate-500 mb-2">CHOOSE A SKILL</div>
            <div className="space-y-2">
                {SKILL_ORDER.map(skillId => {
                    const skill = SKILLS[skillId];
                    const stats = profile.skills[skillId];
                    const unlocked = isSkillUnlocked(skillId, profile);
                    const level = LEVELS[stats?.level || 1];

                    return (
                        <button
                            key={skillId}
                            onClick={() => unlocked && onSelectSkill(skillId)}
                            disabled={!unlocked}
                            className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${unlocked
                                    ? 'bg-slate-800/50 border-slate-700 hover:border-cyan-500 hover:scale-[1.01]'
                                    : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <div className={`text-3xl ${unlocked ? '' : 'grayscale'}`}>{skill.icon}</div>
                            <div className="flex-1 text-left">
                                <div className="font-bold text-white">{skill.name}</div>
                                <div className="text-xs text-slate-400">
                                    {unlocked ? `Level ${stats?.level || 1} • ${level.name}` : '🔒 Complete prerequisites'}
                                </div>
                            </div>
                            {unlocked && stats && (
                                <div className="text-right">
                                    <div className={`text-sm font-bold ${stats.accuracy >= 0.8 ? 'text-emerald-400' : stats.accuracy >= 0.6 ? 'text-amber-400' : 'text-rose-400'}`}>
                                        {Math.round(stats.accuracy * 100)}%
                                    </div>
                                    <div className="text-xs text-slate-500">{stats.total} done</div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// SCREEN: PRACTICE
// ═══════════════════════════════════════════════════════════════
const PracticeScreen = ({ profile, skillId, onBack, onTeach, onUpdateProfile }) => {
    const [problem, setProblem] = useState(null);
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', null
    const [showingAnswer, setShowingAnswer] = useState(false);
    const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });
    const startTime = useRef(Date.now());

    const skill = SKILLS[skillId];
    const stats = profile.skills[skillId];

    useEffect(() => {
        loadNewProblem();
    }, [skillId]);

    const loadNewProblem = useCallback(() => {
        const level = stats?.level || 1;
        const newProblem = generateProblem(skillId, level);
        setProblem(newProblem);
        setFeedback(null);
        setShowingAnswer(false);
        startTime.current = Date.now();
    }, [skillId, stats?.level]);

    const handleAnswer = (selected) => {
        if (feedback) return;

        const isCorrect = selected === problem.answer;
        const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

        // Record attempt
        const updatedProfile = recordAttempt(profile.username, skillId, isCorrect, timeSpent);
        if (updatedProfile) onUpdateProfile(updatedProfile);

        setSessionStats(s => ({
            correct: s.correct + (isCorrect ? 1 : 0),
            wrong: s.wrong + (isCorrect ? 0 : 1)
        }));

        if (isCorrect) {
            setFeedback('correct');
            confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });

            // Check for difficulty adjustment
            const adjustment = calculateNextDifficulty({
                ...stats,
                correct: stats.correct + 1,
                streak: stats.streak + 1
            }, skill.levels);

            if (adjustment.action === 'INCREASE') {
                updateSkillLevel(profile.username, skillId, adjustment.newLevel);
            }

            setTimeout(loadNewProblem, 1000);
        } else {
            setFeedback('wrong');
            setShowingAnswer(true);

            // Check if we need to teach
            const adjustment = calculateNextDifficulty({
                ...stats,
                streak: stats.streak - 1
            }, skill.levels);

            if (adjustment.action === 'TEACH') {
                setTimeout(() => onTeach(skillId), 2000);
            } else if (adjustment.action === 'DECREASE') {
                updateSkillLevel(profile.username, skillId, adjustment.newLevel);
                setTimeout(loadNewProblem, 2000);
            } else {
                setTimeout(loadNewProblem, 2000);
            }
        }
    };

    if (!problem) return null;

    const level = LEVELS[stats?.level || 1];

    return (
        <div className="flex flex-col h-full p-4">
            <style>{styles}</style>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={onBack} className="text-sm text-slate-500 hover:text-white">← Back</button>
                <div className="text-center">
                    <div className="font-bold text-white">{skill.name}</div>
                    <div className={`text-xs text-${level.color}-400`}>Level {stats?.level || 1}: {level.name}</div>
                </div>
                <div className="text-sm">
                    <span className="text-emerald-400">✓{sessionStats.correct}</span>
                    {' / '}
                    <span className="text-rose-400">✗{sessionStats.wrong}</span>
                </div>
            </div>

            {/* Problem */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className={`text-center mb-8 p-6 rounded-2xl border-2 transition-all ${feedback === 'correct' ? 'bg-emerald-500/20 border-emerald-500 pop' :
                        feedback === 'wrong' ? 'bg-rose-500/20 border-rose-500 shake' :
                            'bg-slate-800/50 border-slate-700'
                    }`}>
                    {/* Visual hint if available */}
                    {problem.visual && !showingAnswer && (
                        <div className="text-lg text-slate-400 mb-4">{problem.visual}</div>
                    )}

                    {/* Problem text */}
                    <div className="text-3xl font-black text-white mb-4">
                        {problem.equation || problem.problem}
                    </div>

                    {/* If it's a word problem, show equation */}
                    {problem.equation && (
                        <div className="text-sm text-slate-400">{problem.problem}</div>
                    )}

                    {/* Show correct answer when wrong */}
                    {showingAnswer && (
                        <div className="mt-4 text-emerald-400 font-bold slide-in">
                            Correct answer: {problem.answer}
                        </div>
                    )}
                </div>

                {/* Answer options */}
                {!showingAnswer && (
                    <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                        {problem.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleAnswer(opt)}
                                disabled={!!feedback}
                                className={`py-4 rounded-xl font-black text-xl transition-all ${feedback === 'correct' && opt === problem.answer
                                        ? 'bg-emerald-500 text-white scale-110'
                                        : feedback === 'wrong' && opt === problem.answer
                                            ? 'bg-emerald-500/50 text-white'
                                            : 'bg-slate-800 border-2 border-slate-700 hover:border-cyan-500 text-white'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Streak indicator */}
            <div className="text-center text-sm text-slate-500">
                {stats.streak > 0 && <span className="text-amber-400">🔥 {stats.streak} streak!</span>}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// SCREEN: TEACHING
// ═══════════════════════════════════════════════════════════════
const TeachingScreen = ({ profile, skillId, onBack, onPractice }) => {
    const [step, setStep] = useState(0);
    const content = getTeachingContent(skillId, profile);
    const skill = SKILLS[skillId];

    if (!content) return null;

    const currentStep = content.steps[step];
    const isLastStep = step >= content.steps.length - 1;

    return (
        <div className="flex flex-col h-full p-4 slide-in">
            <style>{styles}</style>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="text-sm text-slate-500 hover:text-white">← Skip</button>
                <div className="text-4xl">{content.icon}</div>
                <div className="text-sm text-slate-500">{step + 1}/{content.steps.length}</div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-black text-white text-center mb-8">{content.title}</h1>

            {/* Connection to prior knowledge */}
            {content.personalMessage && step === 0 && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-6 text-center">
                    <div className="text-cyan-400 font-bold mb-1">💡 You already know this!</div>
                    <div className="text-sm text-slate-300">{content.personalMessage}</div>
                </div>
            )}

            {/* Teaching content */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 max-w-sm text-center slide-in" key={step}>
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
                        className="flex-1 py-3 border border-slate-700 rounded-xl text-white hover:border-white"
                    >
                        ← Previous
                    </button>
                )}
                <button
                    onClick={() => isLastStep ? onPractice() : setStep(s => s + 1)}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white"
                >
                    {isLastStep ? "Let's Practice! →" : 'Next →'}
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function MathMind({ onBack }) {
    const [screen, setScreen] = useState('login'); // login, dashboard, practice, teaching
    const [username, setUsername] = useState(getActiveUser());
    const [profile, setProfile] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState(null);

    // Load profile on mount or username change
    useEffect(() => {
        if (username) {
            const p = getProfile(username);
            setProfile(p);
            setActiveUser(username);
            setScreen('dashboard');
        } else {
            setScreen('login');
        }
    }, [username]);

    const handleLogin = (name) => {
        setUsername(name);
    };

    const handleLogout = () => {
        setActiveUser(null);
        setUsername(null);
        setProfile(null);
        setScreen('login');
    };

    const handleSelectSkill = (skillId) => {
        setSelectedSkill(skillId);
        setScreen('practice');
    };

    const handleTeach = (skillId) => {
        setSelectedSkill(skillId);
        setScreen('teaching');
    };

    const handleBackToDashboard = () => {
        setSelectedSkill(null);
        setScreen('dashboard');
        // Refresh profile
        if (username) setProfile(getProfile(username));
    };

    const analytics = profile ? getAnalytics(username) : null;

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white overflow-hidden">
            <style>{styles}</style>

            {/* Compact header */}
            {screen !== 'login' && (
                <div className="shrink-0 p-3 flex items-center justify-between bg-slate-900/50 border-b border-white/5">
                    <button onClick={onBack} className="text-xs text-slate-500 hover:text-white">← EXIT</button>
                    <div className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        🧠 MathMind
                    </div>
                    <div className="text-xs text-slate-500">{username}</div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {screen === 'login' && (
                    <LoginScreen onLogin={handleLogin} />
                )}

                {screen === 'dashboard' && profile && analytics && (
                    <DashboardScreen
                        profile={profile}
                        analytics={analytics}
                        onSelectSkill={handleSelectSkill}
                        onLogout={handleLogout}
                    />
                )}

                {screen === 'practice' && profile && selectedSkill && (
                    <PracticeScreen
                        profile={profile}
                        skillId={selectedSkill}
                        onBack={handleBackToDashboard}
                        onTeach={handleTeach}
                        onUpdateProfile={setProfile}
                    />
                )}

                {screen === 'teaching' && profile && selectedSkill && (
                    <TeachingScreen
                        profile={profile}
                        skillId={selectedSkill}
                        onBack={handleBackToDashboard}
                        onPractice={() => setScreen('practice')}
                    />
                )}
            </div>
        </div>
    );
}
