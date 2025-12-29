import React from 'react';

export default function FeatureCard({ icon, title, description, color = "cyan", imageSrc }) {
    const colorClasses = {
        cyan: "group-hover:text-cyan-400 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]",
        purple: "group-hover:text-purple-400 group-hover:border-purple-500/50 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]",
        emerald: "group-hover:text-emerald-400 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]"
    };

    return (
        <div className={`p-6 bg-slate-900/40 border border-white/5 rounded-2xl backdrop-blur-sm transition-all duration-300 group hover:-translate-y-1 hover:bg-slate-800/60 ${colorClasses[color] || colorClasses.cyan}`}>
            <div className="mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                {imageSrc ? (
                    <img src={imageSrc} alt={title} className="w-16 h-16 rounded-full border border-white/10 shadow-lg" />
                ) : (
                    <div className="text-4xl filter drop-shadow-md">{icon}</div>
                )}
            </div>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide group-hover:text-white transition-colors">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                {description}
            </p>
        </div>
    );
}
