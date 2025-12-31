import { useState, useRef } from 'react';

export default function FeatureCard({ icon, title, description, color = "cyan", imageSrc }) {
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);

    const colorConfig = {
        cyan: {
            gradient: "from-cyan-500/20 to-blue-500/20",
            border: "border-cyan-500/30",
            glow: "shadow-[0_0_30px_rgba(6,182,212,0.2)]",
            text: "text-cyan-400",
            iconBg: "bg-cyan-500/10"
        },
        purple: {
            gradient: "from-purple-500/20 to-pink-500/20",
            border: "border-purple-500/30",
            glow: "shadow-[0_0_30px_rgba(168,85,247,0.2)]",
            text: "text-purple-400",
            iconBg: "bg-purple-500/10"
        },
        emerald: {
            gradient: "from-emerald-500/20 to-teal-500/20",
            border: "border-emerald-500/30",
            glow: "shadow-[0_0_30px_rgba(52,211,153,0.2)]",
            text: "text-emerald-400",
            iconBg: "bg-emerald-500/10"
        }
    };

    const cfg = colorConfig[color] || colorConfig.cyan;

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setTilt({
            x: (y - 0.5) * 15,
            y: (x - 0.5) * -15
        });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
        setIsHovered(false);
    };

    return (
        <div
            ref={cardRef}
            className="perspective-1000 group"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className={`
                    preserve-3d p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 cursor-pointer
                    bg-gradient-to-br ${cfg.gradient} bg-slate-900/60
                    border ${isHovered ? cfg.border : 'border-white/5'}
                    ${isHovered ? cfg.glow : ''}
                    hover:-translate-y-2
                `}
                style={{
                    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
                    transition: 'transform 0.15s ease-out, box-shadow 0.3s ease, border-color 0.3s ease'
                }}
            >
                {/* Shine overlay */}
                <div
                    className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: `radial-gradient(circle at ${(tilt.y + 7.5) / 15 * 100}% ${(tilt.x + 7.5) / 15 * 100}%, rgba(255,255,255,0.1), transparent 50%)`
                    }}
                />

                {/* Icon */}
                <div className={`mb-4 relative inline-block transition-transform duration-300 ${isHovered ? 'scale-110 -rotate-3' : ''}`}>
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt={title}
                            className={`w-16 h-16 rounded-xl border ${cfg.border} shadow-lg ${isHovered ? cfg.glow : ''} transition-all duration-300`}
                        />
                    ) : (
                        <div className={`text-5xl filter drop-shadow-lg ${isHovered ? 'animate-bounce' : ''}`}>
                            {icon}
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className={`text-lg font-bold mb-2 uppercase tracking-wide transition-colors duration-300 ${isHovered ? cfg.text : 'text-white'}`}>
                    {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                    {description}
                </p>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r ${cfg.gradient.replace('/20', '')} rounded-full transition-all duration-300 ${isHovered ? 'w-1/2 opacity-100' : 'w-0 opacity-0'}`} />
            </div>
        </div>
    );
}

