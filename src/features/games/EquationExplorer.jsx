import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
    SKILLS,
    generateProblem,
    getWorkedExample,
    getHint,
    getSkillList,
    updateMastery,
    resetMastery
} from './offsetOperator/educationEngine';

// ============ STYLES ============
const styles = `
    @keyframes correctPop {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    @keyframes wrongShake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-8px); }
        40%, 80% { transform: translateX(8px); }
    }
    @keyframes fadeSlideIn {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes masteryBurst {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.3); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
    }
    .correct-pop { animation: correctPop 0.3s ease-out; }
    .wrong-shake { animation: wrongShake 0.4s ease-out; }
    .fade-slide-in { animation: fadeSlideIn 0.4s ease-out; }
    .mastery-burst { animation: masteryBurst 0.5s ease-out; }
`;

export default function EquationExplorer({ onBack }) {
    // Game state
    const [screen, setScreen] = useState('menu'); // menu, skill_select, learning, playing, result
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [currentProblem, setCurrentProblem] = useState(null);
    const [feedback, setFeedback] = useState(null); // null, 'correct', 'wrong'
    const [hintsUsed, setHintsUsed] = useState(0);
    const [currentHint, setCurrentHint] = useState(null);
    const [showWorkedExample, setShowWorkedExample] = useState(false);
    const [exampleStep, setExampleStep] = useState(0);
    const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, xp: 0 });
    const [skillsData, setSkillsData] = useState([]);
    const [justMastered, setJustMastered] = useState(false);
    const [wrongAnswerExplanation, setWrongAnswerExplanation] = useState(null);
    const [questionsThisSession, setQuestionsThisSession] = useState(0);

    // Load skills on mount
    useEffect(() => {
        setSkillsData(getSkillList());
    }, []);

    const refreshSkills = () => setSkillsData(getSkillList());

    // Start practicing a skill
    const startPractice = useCallback((skill) => {
        setSelectedSkill(skill);
        setSessionStats({ correct: 0, wrong: 0, xp: 0 });
        setQuestionsThisSession(0);

        // Check if this is first time - show worked example
        const mastery = skill.mastery;
        if (mastery.total === 0) {
            const example = getWorkedExample(skill.id);
            if (example) {
                setShowWorkedExample(true);
                setExampleStep(0);
                setScreen('learning');
                return;
            }
        }

        setScreen('playing');
        loadNewProblem(skill.id);
    }, []);

    const loadNewProblem = useCallback((skillId) => {
        const problem = generateProblem(skillId);
        setCurrentProblem(problem);
        setFeedback(null);
        setCurrentHint(null);
        setHintsUsed(0);
        setWrongAnswerExplanation(null);
    }, []);

    const finishWorkedExample = () => {
        setShowWorkedExample(false);
        setScreen('playing');
        loadNewProblem(selectedSkill.id);
    };

    // Handle answer selection
    const handleAnswer = (selected) => {
        if (feedback) return; // Already answered

        const isCorrect = selected === currentProblem.answer;
        const masteryResult = updateMastery(selectedSkill.id, isCorrect);

        setQuestionsThisSession(q => q + 1);

        if (isCorrect) {
            setFeedback('correct');
            const xpGain = hintsUsed === 0 ? 15 : hintsUsed === 1 ? 10 : 5;
            setSessionStats(s => ({ ...s, correct: s.correct + 1, xp: s.xp + xpGain }));

            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            });

            // Check for mastery unlock
            if (masteryResult.mastered && !selectedSkill.mastery.mastered) {
                setJustMastered(true);
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.5 },
                    colors: ['#FFD700', '#FFA500', '#FF6347']
                });
            }

            setTimeout(() => {
                setFeedback(null);
                setJustMastered(false);
                loadNewProblem(selectedSkill.id);
                refreshSkills();
            }, 1200);
        } else {
            setFeedback('wrong');
            setSessionStats(s => ({ ...s, wrong: s.wrong + 1 }));
            setWrongAnswerExplanation({
                yourAnswer: selected,
                correctAnswer: currentProblem.answer,
                steps: currentProblem.steps
            });
        }
    };

    const continueAfterWrong = () => {
        setFeedback(null);
        setWrongAnswerExplanation(null);
        loadNewProblem(selectedSkill.id);
        refreshSkills();
    };

    const useHint = () => {
        if (hintsUsed >= 3) return;
        const nextLevel = hintsUsed + 1;
        const hint = getHint(selectedSkill.id, nextLevel, currentProblem);
        setCurrentHint(hint);
        setHintsUsed(nextLevel);
    };

    const endSession = () => {
        setScreen('result');
        refreshSkills();
    };

    // ============ RENDER ============
    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white overflow-hidden">
            <style>{styles}</style>

            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-900/50 border-b border-white/5">
                <button
                    onClick={() => screen === 'menu' ? onBack() : setScreen('menu')}
                    className="text-xs text-slate-400 hover:text-white"
                >
                    ← {screen === 'menu' ? 'ARCADE' : 'MENU'}
                </button>
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    EQUATION EXPLORER
                </h1>
                <div className="text-xs text-slate-500">
                    {sessionStats.xp > 0 && <span className="text-yellow-400">⭐ {sessionStats.xp} XP</span>}
                </div>
            </div>

            {/* MENU SCREEN */}
            {screen === 'menu' && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center fade-slide-in">
                    <div className="text-6xl mb-4">🏰</div>
                    <h2 className="text-3xl sm:text-4xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        EQUATION EXPLORER
                    </h2>
                    <p className="text-slate-400 mb-8 max-w-xs">Master math skills one level at a time. Unlock rooms in the castle!</p>

                    <button
                        onClick={() => setScreen('skill_select')}
                        className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-black text-lg hover:scale-105 transition-transform shadow-lg shadow-purple-500/30"
                    >
                        START EXPLORING
                    </button>

                    <button
                        onClick={() => { resetMastery(); refreshSkills(); }}
                        className="mt-4 text-xs text-slate-500 hover:text-red-400"
                    >
                        Reset Progress
                    </button>
                </div>
            )}

            {/* SKILL SELECT SCREEN */}
            {screen === 'skill_select' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <h2 className="text-xl font-bold mb-4 text-center">Choose Your Challenge</h2>
                    <div className="grid gap-3 max-w-md mx-auto">
                        {skillsData.map(skill => {
                            const accuracy = skill.mastery.total > 0
                                ? Math.round((skill.mastery.correct / skill.mastery.total) * 100)
                                : 0;
                            const progress = Math.min(100, (skill.mastery.total / 10) * 100);

                            return (
                                <button
                                    key={skill.id}
                                    onClick={() => startPractice(skill)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${skill.mastery.mastered
                                            ? 'bg-yellow-500/10 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                                            : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`text-3xl ${skill.mastery.mastered ? 'mastery-burst' : ''}`}>
                                            {skill.mastery.mastered ? '👑' : skill.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold truncate">{skill.name}</span>
                                                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">Lv{skill.level}</span>
                                            </div>
                                            <div className="text-xs text-slate-400 truncate">{skill.description}</div>

                                            {/* Progress bar */}
                                            {skill.mastery.total > 0 && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all ${skill.mastery.mastered ? 'bg-yellow-400' : 'bg-cyan-500'}`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-slate-500">{accuracy}%</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-slate-600">→</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* LEARNING SCREEN (Worked Example) */}
            {screen === 'learning' && selectedSkill && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center fade-slide-in">
                    <div className="text-4xl mb-4">📖</div>
                    <h2 className="text-xl font-bold mb-2">Learning: {selectedSkill.name}</h2>

                    <div className="bg-slate-800/80 rounded-2xl p-6 max-w-sm w-full border border-white/10 mb-6">
                        <div className="text-sm text-cyan-400 font-bold mb-4">EXAMPLE</div>
                        <div className="text-3xl font-black mb-6">{selectedSkill.example.problem}</div>

                        <div className="space-y-3 text-left">
                            {selectedSkill.example.steps.map((step, i) => (
                                <div
                                    key={i}
                                    className={`p-3 rounded-lg transition-all duration-300 ${i <= exampleStep ? 'bg-cyan-500/20 border border-cyan-500/30 fade-slide-in' : 'opacity-0 h-0 overflow-hidden'
                                        }`}
                                >
                                    <span className="text-cyan-400 font-bold mr-2">Step {i + 1}:</span>
                                    {step}
                                </div>
                            ))}
                        </div>

                        {exampleStep >= selectedSkill.example.steps.length - 1 && (
                            <div className="mt-4 text-2xl font-black text-emerald-400 fade-slide-in">
                                Answer: {selectedSkill.example.answer}
                            </div>
                        )}
                    </div>

                    {exampleStep < selectedSkill.example.steps.length - 1 ? (
                        <button
                            onClick={() => setExampleStep(s => s + 1)}
                            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold transition-colors"
                        >
                            Next Step →
                        </button>
                    ) : (
                        <button
                            onClick={finishWorkedExample}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-colors"
                        >
                            Got it! Let me try →
                        </button>
                    )}
                </div>
            )}

            {/* PLAYING SCREEN */}
            {screen === 'playing' && selectedSkill && currentProblem && (
                <div className="flex-1 flex flex-col p-4 sm:p-6">
                    {/* Skill info bar */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{selectedSkill.icon}</span>
                            <span className="text-sm font-bold text-slate-300">{selectedSkill.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="text-emerald-400">✓ {sessionStats.correct}</span>
                            <span className="text-rose-400">✗ {sessionStats.wrong}</span>
                            <button onClick={endSession} className="text-slate-500 hover:text-white">End</button>
                        </div>
                    </div>

                    {/* Mastery flash */}
                    {justMastered && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 fade-slide-in">
                            <div className="text-center mastery-burst">
                                <div className="text-8xl mb-4">👑</div>
                                <div className="text-3xl font-black text-yellow-400">MASTERED!</div>
                                <div className="text-slate-400">{selectedSkill.name}</div>
                            </div>
                        </div>
                    )}

                    {/* Problem display */}
                    <div className={`flex-1 flex flex-col items-center justify-center ${feedback === 'wrong' ? 'wrong-shake' : feedback === 'correct' ? 'correct-pop' : ''}`}>
                        <div className={`text-4xl sm:text-5xl font-black mb-8 p-6 rounded-2xl border-2 transition-all ${feedback === 'correct' ? 'bg-emerald-500/20 border-emerald-500' :
                                feedback === 'wrong' ? 'bg-rose-500/20 border-rose-500' :
                                    'bg-slate-800/50 border-slate-700'
                            }`}>
                            {currentProblem.problem}
                        </div>

                        {/* Hint display */}
                        {currentHint && !feedback && (
                            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl max-w-sm text-center fade-slide-in">
                                <div className="text-xs text-amber-400 font-bold mb-1">
                                    {currentHint.type === 'concept' ? '💡 CONCEPT' : currentHint.type === 'step' ? '📝 FIRST STEP' : '✅ SOLUTION'}
                                </div>
                                <div className="text-amber-200">{currentHint.text}</div>
                            </div>
                        )}

                        {/* Wrong answer explanation */}
                        {wrongAnswerExplanation && (
                            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl max-w-sm text-center fade-slide-in">
                                <div className="text-rose-400 font-bold mb-2">Let&apos;s learn from this!</div>
                                <div className="text-sm text-slate-300 mb-3">
                                    You answered <span className="text-rose-400 font-bold">{wrongAnswerExplanation.yourAnswer}</span>
                                    <br />Correct answer: <span className="text-emerald-400 font-bold">{wrongAnswerExplanation.correctAnswer}</span>
                                </div>
                                <div className="text-left text-xs text-slate-400 space-y-1">
                                    {wrongAnswerExplanation.steps.map((step, i) => (
                                        <div key={i}>• {step}</div>
                                    ))}
                                </div>
                                <button
                                    onClick={continueAfterWrong}
                                    className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold"
                                >
                                    Try Next Problem →
                                </button>
                            </div>
                        )}

                        {/* Answer options */}
                        {!wrongAnswerExplanation && (
                            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                                {currentProblem.options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(opt)}
                                        disabled={!!feedback}
                                        className={`py-4 rounded-xl font-black text-xl transition-all ${feedback === 'correct' && opt === currentProblem.answer
                                                ? 'bg-emerald-500 text-white scale-110'
                                                : feedback === 'wrong' && opt === currentProblem.answer
                                                    ? 'bg-emerald-500/50 text-white'
                                                    : 'bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-cyan-500'
                                            } disabled:cursor-not-allowed`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Hint button */}
                    {!feedback && !wrongAnswerExplanation && (
                        <div className="text-center mt-4">
                            <button
                                onClick={useHint}
                                disabled={hintsUsed >= 3}
                                className={`text-sm px-4 py-2 rounded-lg transition-colors ${hintsUsed >= 3 ? 'text-slate-600' : 'text-amber-400 hover:bg-amber-500/10'
                                    }`}
                            >
                                💡 Hint ({3 - hintsUsed} left)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* RESULT SCREEN */}
            {screen === 'result' && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center fade-slide-in">
                    <div className="text-6xl mb-4">
                        {sessionStats.correct > sessionStats.wrong ? '🎉' : '💪'}
                    </div>
                    <h2 className="text-2xl font-black mb-6">Session Complete!</h2>

                    <div className="bg-slate-800/50 rounded-2xl p-6 max-w-xs w-full border border-white/10 mb-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-3xl font-black text-emerald-400">{sessionStats.correct}</div>
                                <div className="text-xs text-slate-500">Correct</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-rose-400">{sessionStats.wrong}</div>
                                <div className="text-xs text-slate-500">Wrong</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-yellow-400">{sessionStats.xp}</div>
                                <div className="text-xs text-slate-500">XP</div>
                            </div>
                        </div>

                        {sessionStats.correct + sessionStats.wrong > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <div className="text-sm text-slate-400">
                                    Accuracy: <span className="font-bold text-white">
                                        {Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.wrong)) * 100)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => startPractice(selectedSkill)}
                            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold"
                        >
                            Practice Again
                        </button>
                        <button
                            onClick={() => setScreen('skill_select')}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold"
                        >
                            Choose Skill
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
