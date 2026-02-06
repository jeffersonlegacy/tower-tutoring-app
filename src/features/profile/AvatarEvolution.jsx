import React, { useState, useRef, useEffect } from 'react';
import { Upload, RefreshCw, Lock, Check, Zap, Sparkles, Star, Crown, Shield, Flame } from 'lucide-react';
import { useMastery } from '../../context/MasteryContext';
import confetti from 'canvas-confetti';

// --- EVOLUTION STAGES WITH VISUAL THEMES ---
const EVOLUTION_STAGES = [
    { 
        id: 1, 
        label: 'HERO INITIATE', 
        level: 1, 
        icon: Shield,
        color: 'cyan',
        gradient: 'from-cyan-500 to-blue-600',
        description: 'Your journey begins!',
        effect: 'subtle-glow'
    },
    { 
        id: 2, 
        label: 'RISING CHAMPION', 
        level: 5, 
        icon: Zap,
        color: 'emerald',
        gradient: 'from-emerald-400 to-teal-600',
        description: 'Powers awakening',
        effect: 'energy-aura'
    },
    { 
        id: 3, 
        label: 'ELITE GUARDIAN', 
        level: 15, 
        icon: Star,
        color: 'violet',
        gradient: 'from-violet-500 to-purple-700',
        description: 'Master of skills',
        effect: 'cosmic-ring'
    },
    { 
        id: 4, 
        label: 'MYTHIC LEGEND', 
        level: 30, 
        icon: Crown,
        color: 'amber',
        gradient: 'from-amber-400 to-orange-600',
        description: 'Legendary status',
        effect: 'fire-aura'
    },
    { 
        id: 5, 
        label: 'TRANSCENDENT', 
        level: 50, 
        icon: Flame,
        color: 'rose',
        gradient: 'from-rose-400 via-pink-500 to-purple-600',
        description: 'Beyond limits',
        effect: 'rainbow-aura'
    },
];

// --- PREMIUM HERO TRANSFORMATION ENGINE ---
const createHeroAvatar = (imageSrc, stage = 1) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const size = 512;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            // Draw base image centered/cropped
            const scale = Math.max(size / img.width, size / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (size - w) / 2;
            const y = (size - h) / 2;
            ctx.drawImage(img, x, y, w, h);

            // Get image data for pixel manipulation
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;

            // === HERO TRANSFORMATION EFFECTS ===
            
            // 1. Dramatic contrast boost
            const contrast = 1.4;
            const brightness = 10;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128 + brightness));
                data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness));
                data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness));
            }

            // 2. Hero color grading based on stage
            const stageConfig = EVOLUTION_STAGES[stage - 1] || EVOLUTION_STAGES[0];
            const colorOverlays = {
                cyan: [0, 180, 220],
                emerald: [16, 185, 129],
                violet: [139, 92, 246],
                amber: [245, 158, 11],
                rose: [244, 63, 94]
            };
            const overlay = colorOverlays[stageConfig.color] || [0, 180, 220];
            
            for (let i = 0; i < data.length; i += 4) {
                // Add subtle color tint
                data[i] = Math.min(255, data[i] * 0.85 + overlay[0] * 0.15);
                data[i + 1] = Math.min(255, data[i + 1] * 0.85 + overlay[1] * 0.15);
                data[i + 2] = Math.min(255, data[i + 2] * 0.85 + overlay[2] * 0.15);
            }

            // 3. Vignette effect for dramatic focus
            const centerX = size / 2;
            const centerY = size / 2;
            const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
            
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const i = (y * size + x) * 4;
                    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                    const vignette = 1 - Math.pow(dist / maxDist, 2) * 0.5;
                    data[i] *= vignette;
                    data[i + 1] *= vignette;
                    data[i + 2] *= vignette;
                }
            }

            ctx.putImageData(imageData, 0, 0);

            // 4. Add glow/aura effect
            const glowCanvas = document.createElement('canvas');
            glowCanvas.width = size;
            glowCanvas.height = size;
            const glowCtx = glowCanvas.getContext('2d');
            
            // Draw glow behind
            const gradient = glowCtx.createRadialGradient(
                size/2, size/2, size * 0.3,
                size/2, size/2, size * 0.6
            );
            gradient.addColorStop(0, `rgba(${overlay[0]}, ${overlay[1]}, ${overlay[2]}, 0.4)`);
            gradient.addColorStop(0.5, `rgba(${overlay[0]}, ${overlay[1]}, ${overlay[2]}, 0.2)`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            glowCtx.fillStyle = gradient;
            glowCtx.fillRect(0, 0, size, size);
            
            // Composite
            glowCtx.globalCompositeOperation = 'source-over';
            glowCtx.drawImage(canvas, 0, 0);

            // 5. Add comic-style edge enhancement
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = size;
            finalCanvas.height = size;
            const finalCtx = finalCanvas.getContext('2d');
            
            // Draw glow layer
            finalCtx.drawImage(glowCanvas, 0, 0);
            
            // Add subtle outer glow ring
            finalCtx.strokeStyle = `rgba(${overlay[0]}, ${overlay[1]}, ${overlay[2]}, 0.6)`;
            finalCtx.lineWidth = 8;
            finalCtx.shadowColor = `rgb(${overlay[0]}, ${overlay[1]}, ${overlay[2]})`;
            finalCtx.shadowBlur = 30;
            finalCtx.beginPath();
            finalCtx.arc(size/2, size/2, size/2 - 20, 0, Math.PI * 2);
            finalCtx.stroke();

            resolve(finalCanvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(imageSrc);
        img.src = imageSrc;
    });
};

// --- SILICONFLOW STABLE DIFFUSION IMG2IMG ---
const generateSiliconFlowAvatar = async (imageSrc) => {
    const apiKey = import.meta.env.VITE_SILICONFLOW_API_KEY;
    
    if (!apiKey) {
        console.warn('[Avatar] No SiliconFlow API key');
        return null;
    }

    try {
        // Note: FLUX models do text-to-image, not img2img
        // We'll generate a hero avatar based on a prompt description
        const response = await fetch('https://api.siliconflow.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'black-forest-labs/FLUX.1-schnell', // Fast, high quality
                prompt: `Epic superhero portrait, heroic pose, vibrant colors, dynamic energy aura, cosmic background, anime style, bold saturated colors, glowing effects, powerful inspiring mood, cape flowing, premium quality avatar, masterpiece, young hero, determined expression`,
                image_size: '512x512',
                num_images: 1
            })
        });

        const data = await response.json();
        
        if (data.images?.[0]?.url) {
            // Fetch the generated image and convert to base64
            const imgResponse = await fetch(data.images[0].url);
            const blob = await imgResponse.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } else if (data.images?.[0]?.b64_json) {
            return `data:image/png;base64,${data.images[0].b64_json}`;
        }
        
        console.warn('[Avatar] SiliconFlow response:', data);
        return null;
    } catch (error) {
        console.error('[Avatar] SiliconFlow generation failed:', error);
        return null;
    }
};

// --- GEMINI AI BACKUP ---
const generateGeminiAvatar = async (imageSrc) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
        console.warn('[Avatar] No Gemini API key');
        return null;
    }

    try {
        const base64Data = imageSrc.split(',')[1];
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: `Create an AMAZING superhero portrait based on this person's photo.
                                
CRITICAL REQUIREMENTS:
- Transform into a vibrant, colorful superhero/anime hero style
- Keep their face recognizable but heroic
- Add glowing energy effects and power auras
- Include a cool hero costume with cape
- Background: Dynamic energy bursts, not plain
- Style: Premium quality, something a kid would LOVE
- Colors: Bold, saturated, eye-catching
- Mood: Epic, powerful, inspiring

Output a single heroic portrait suitable for an avatar.`
                            },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: base64Data
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        responseModalities: ["image", "text"],
                        responseMimeType: "image/png"
                    }
                })
            }
        );

        const data = await response.json();
        
        if (data.candidates?.[0]?.content?.parts) {
            for (const part of data.candidates[0].content.parts) {
                if (part.inline_data?.data) {
                    return `data:image/png;base64,${part.inline_data.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error('[Avatar] Gemini generation failed:', error);
        return null;
    }
};

// --- MASTER AI AVATAR GENERATOR (tries all providers) ---
const generateAIAvatar = async (imageSrc, setStep) => {
    // 1. Try Gemini first (supports img2img - transforms actual photo)
    setStep?.('🤖 AI Photo Transformation (Gemini)...');
    let result = await generateGeminiAvatar(imageSrc);
    if (result) return result;
    
    // 2. Fallback to SiliconFlow FLUX (generates new hero portrait)
    setStep?.('🎨 AI Hero Generation (FLUX)...');
    result = await generateSiliconFlowAvatar(imageSrc);
    if (result) return result;
    
    // 3. Canvas effects fallback (always works, transforms actual photo)
    return null;
};

export default function AvatarEvolution({ onClose, onSave }) {
    const { studentProfile } = useMastery();
    const [mode, setMode] = useState('intro');
    const [rawImage, setRawImage] = useState(null);
    const [heroImage, setHeroImage] = useState(null);
    const [processingStep, setProcessingStep] = useState('');
    const currentLevel = studentProfile?.level || 1;
    
    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setRawImage(ev.target.result);
                setMode('processing');
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (mode !== 'processing' || !rawImage) return;

        const processAvatar = async () => {
            // Step 1: Analyzing
            setProcessingStep('Analyzing your features...');
            await new Promise(r => setTimeout(r, 1500));

            // Step 2: Try AI providers (SiliconFlow → Gemini)
            let result = await generateAIAvatar(rawImage, setProcessingStep);
            
            // Step 3: Fallback to canvas effects if AI fails
            if (!result) {
                setProcessingStep('Applying hero effects...');
                result = await createHeroAvatar(rawImage, 1);
            }

            // Step 4: Complete
            setProcessingStep('Finalizing your avatar...');
            await new Promise(r => setTimeout(r, 800));
            
            setHeroImage(result);
            setMode('result');
            
            confetti({
                particleCount: 200,
                spread: 120,
                origin: { y: 0.5 },
                colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#10b981']
            });
        };

        processAvatar();
    }, [mode, rawImage]);

    const handleConfirm = () => {
        onSave({ type: 'hero', src: heroImage, stage: 1 });
        onClose();
    };

    const getUnlockedStage = () => {
        for (let i = EVOLUTION_STAGES.length - 1; i >= 0; i--) {
            if (currentLevel >= EVOLUTION_STAGES[i].level) return EVOLUTION_STAGES[i].id;
        }
        return 1;
    };

    return (
        <div className="bg-slate-900 border border-amber-500/30 rounded-3xl overflow-hidden max-w-3xl w-full mx-auto shadow-2xl relative">
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-amber-900/50 via-rose-900/50 to-purple-900/50 p-5 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-rose-500 rounded-xl flex items-center justify-center">
                        <Sparkles className="text-white" size={22} />
                    </div>
                    <div>
                        <h2 className="font-black text-white tracking-wide text-lg">HERO AVATAR CREATOR</h2>
                        <p className="text-amber-300/70 text-xs">Transform into your legendary self</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition text-2xl">×</button>
            </div>

            <div className="p-8">
                {/* EVOLUTION STAGES PREVIEW - Always visible */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-8 h-px bg-slate-700"></span>
                        Evolution Path
                        <span className="flex-1 h-px bg-slate-700"></span>
                    </h3>
                    
                    <div className="grid grid-cols-5 gap-3">
                        {EVOLUTION_STAGES.map((stage) => {
                            const Icon = stage.icon;
                            const isUnlocked = currentLevel >= stage.level;
                            
                            return (
                                <div 
                                    key={stage.id}
                                    className={`relative p-4 rounded-2xl border transition-all ${
                                        isUnlocked 
                                            ? `bg-gradient-to-br ${stage.gradient} border-white/20 shadow-lg` 
                                            : 'bg-slate-800/50 border-slate-700/50'
                                    }`}
                                >
                                    {/* Lock overlay for locked stages */}
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                                            <Lock className="text-slate-500" size={24} />
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-col items-center text-center">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                                            isUnlocked ? 'bg-white/20' : 'bg-slate-700/50'
                                        }`}>
                                            <Icon className={isUnlocked ? 'text-white' : 'text-slate-500'} size={24} />
                                        </div>
                                        <div className={`text-[10px] font-black tracking-wider mb-1 ${
                                            isUnlocked ? 'text-white' : 'text-slate-500'
                                        }`}>
                                            {stage.label}
                                        </div>
                                        <div className={`text-[9px] ${isUnlocked ? 'text-white/70' : 'text-slate-600'}`}>
                                            Lvl {stage.level}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col items-center min-h-[300px]">
                    
                    {mode === 'intro' && (
                        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                            <div className="w-40 h-40 bg-gradient-to-br from-amber-500/20 to-rose-500/20 rounded-full mx-auto flex items-center justify-center border-4 border-dashed border-amber-500/40 relative">
                                <span className="text-6xl">🦸</span>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center animate-bounce">
                                    <Sparkles className="text-white" size={16} />
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-3xl font-black text-white mb-3">BECOME A HERO</h3>
                                <p className="text-slate-400 max-w-md mx-auto">
                                    Upload your photo and watch as you transform into an 
                                    <span className="text-amber-400 font-bold"> EPIC SUPERHERO!</span>
                                </p>
                            </div>
                            
                            <div className="bg-slate-800/50 rounded-xl p-4 max-w-sm mx-auto border border-white/5">
                                <p className="text-slate-500 text-sm">
                                    📸 <span className="text-slate-300">Best results:</span> Good lighting, face the camera, shoulders up
                                </p>
                            </div>
                            
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 hover:from-amber-400 hover:via-rose-400 hover:to-purple-400 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-wide flex items-center gap-3 transition-all hover:scale-105 shadow-2xl shadow-amber-500/25 mx-auto"
                            >
                                <Upload size={22} /> Upload Your Photo
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>
                    )}

                    {mode === 'processing' && (
                        <div className="relative w-full max-w-md aspect-square">
                            {/* Animated background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-purple-500/10 rounded-3xl animate-pulse"></div>
                            
                            <div className="relative w-full h-full bg-slate-800 rounded-3xl overflow-hidden border-4 border-amber-500/30 shadow-2xl">
                                <img src={rawImage} alt="Processing" className="w-full h-full object-cover opacity-60" />
                                
                                {/* Scanning overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-400/30 to-transparent animate-[scan_2s_ease-in-out_infinite]"></div>
                                
                                {/* Energy particles */}
                                <div className="absolute inset-0 overflow-hidden">
                                    {[...Array(20)].map((_, i) => (
                                        <div 
                                            key={i}
                                            className="absolute w-2 h-2 bg-amber-400 rounded-full animate-ping"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                top: `${Math.random() * 100}%`,
                                                animationDelay: `${Math.random() * 2}s`,
                                                animationDuration: `${1 + Math.random()}s`
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Status bar */}
                                <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur p-4 border-t border-amber-500/30">
                                    <div className="flex items-center gap-3 text-amber-400 font-mono text-sm">
                                        <RefreshCw className="animate-spin" size={18} />
                                        {processingStep}
                                    </div>
                                    <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 animate-[progress_3s_ease-in-out_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'result' && (
                        <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
                            {/* Hero Avatar Display */}
                            <div className="relative mb-8">
                                {/* Glow effect */}
                                <div className="absolute -inset-8 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                                
                                {/* Avatar frame */}
                                <div className="relative w-56 h-56 rounded-3xl overflow-hidden border-4 border-amber-400/50 shadow-2xl shadow-amber-500/20">
                                    <img 
                                        src={heroImage} 
                                        alt="Your Hero Avatar" 
                                        className="w-full h-full object-cover"
                                    />
                                    
                                    {/* Badge */}
                                    <div className="absolute bottom-2 right-2 bg-gradient-to-r from-amber-500 to-rose-500 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1 shadow-lg">
                                        <Zap size={12} /> HERO
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-3xl font-black text-white mb-2">YOUR HERO IDENTITY</h3>
                            <p className="text-slate-400 mb-6">Ready to save the world (and ace math)?</p>

                            <button 
                                onClick={handleConfirm}
                                className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 hover:from-amber-400 hover:via-rose-400 hover:to-purple-400 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:scale-105 transition-transform"
                            >
                                <Check size={22} /> Equip Hero Avatar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0%, 100% { transform: translateY(-100%); }
                    50% { transform: translateY(100%); }
                }
                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                }
            `}</style>
        </div>
    );
}
