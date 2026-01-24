import React from 'react';

/**
 * AvatarCanvas.jsx
 * A stateless SVG-based avatar renderer.
 * 
 * Config shape: {
 *   topType: 'shortHair' | 'longHair' | 'hat' | 'bald',
 *   accessoriesType: 'none' | 'glasses' | 'sunglasses' | 'crown',
 *   hairColor: string (hex),
 *   facialHairType: 'none' | 'beard' | 'stubble',
 *   clotheType: 'shirt' | 'hoodie' | 'overall',
 *   clotheColor: string (hex),
 *   eyeType: 'default' | 'happy' | 'closed' | 'wink',
 *   mouthType: 'default' | 'smile' | 'serious',
 *   skinColor: string (hex),
 *   circleColor: string (hex)
 * }
 */

export default function AvatarCanvas({ config, size = 120, className = "" }) {
    const {
        skinColor = '#EDB98A',
        hairColor = '#4A312C',
        clotheColor = '#3B82F6',
        circleColor = '#1E293B',
        eyeType = 'default',
        mouthType = 'smile',
        topType = 'shortHair',
        accessoriesType = 'none'
    } = config || {};

    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 200 200" 
            className={`rounded-full overflow-hidden ${className}`}
            style={{ backgroundColor: circleColor }}
        >
            {/* Background Circle */}
            <circle cx="100" cy="100" r="100" fill={circleColor} />

            {/* Neck */}
            <rect x="85" y="140" width="30" height="20" fill={skinColor} stroke="black" strokeWidth="0.5" opacity="0.8" />

            {/* Body / Clothes */}
            <path 
                d="M40,190 Q40,140 100,140 Q160,140 160,190 L160,200 L40,200 Z" 
                fill={clotheColor} 
                stroke="rgba(0,0,0,0.1)" 
                strokeWidth="2"
            />

            {/* Face Base */}
            <path 
                d="M60,80 Q60,150 100,150 Q140,150 140,80 Q140,40 100,40 Q60,40 60,80 Z" 
                fill={skinColor} 
            />

            {/* Eyes */}
            {eyeType === 'default' && (
                <>
                    <circle cx="85" cy="85" r="4" fill="#000" />
                    <circle cx="115" cy="85" r="4" fill="#000" />
                </>
            )}
            {eyeType === 'happy' && (
                <>
                    <path d="M78,88 Q85,80 92,88" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M108,88 Q115,80 122,88" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                </>
            )}
            {eyeType === 'wink' && (
                <>
                    <circle cx="85" cy="85" r="4" fill="#000" />
                    <path d="M108,88 Q115,80 122,88" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                </>
            )}

            {/* Mouth */}
            {mouthType === 'smile' && (
                <path d="M85,115 Q100,130 115,115" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            )}
            {mouthType === 'default' && (
                <line x1="90" y1="120" x2="110" y2="120" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            )}

            {/* Hair / Top */}
            {topType === 'shortHair' && (
                <path 
                    d="M60,75 Q60,35 100,35 Q140,35 140,75 Q140,65 130,55 Q100,45 70,55 Q60,65 60,75 Z" 
                    fill={hairColor} 
                />
            )}
            {topType === 'longHair' && (
                <path 
                    d="M60,80 Q50,80 50,130 L50,150 Q50,160 60,160 L140,160 Q150,160 150,150 L150,130 Q150,80 140,80 Q140,40 100,40 Q60,40 60,80 Z" 
                    fill={hairColor} 
                />
            )}

            {/* Accessories */}
            {accessoriesType === 'crown' && (
                <path 
                    d="M70,40 L80,20 L100,35 L120,20 L130,40 Z" 
                    fill="#FDE047" 
                    stroke="#A16207" 
                    strokeWidth="1"
                />
            )}
            {accessoriesType === 'glasses' && (
                <>
                    <rect x="75" y="80" width="20" height="15" rx="2" fill="none" stroke="#334155" strokeWidth="2" />
                    <rect x="105" y="80" width="20" height="15" rx="2" fill="none" stroke="#334155" strokeWidth="2" />
                    <line x1="95" y1="87" x2="105" y2="87" stroke="#334155" strokeWidth="2" />
                </>
            )}
        </svg>
    );
}
