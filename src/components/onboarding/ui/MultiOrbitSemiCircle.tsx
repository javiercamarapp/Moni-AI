
import React from "react";

// USANDO API DE LOGOS EMPRESARIAL (Clearbit)
// Estas URLs son mucho más estables que Wikimedia y están diseñadas para aplicaciones.
const BANK_ICONS = [
    // 1. BBVA
    "https://logo.clearbit.com/bbva.mx",
    // 2. Santander
    "https://logo.clearbit.com/santander.com.mx",
    // 3. Banorte
    "https://logo.clearbit.com/banorte.com",
    // 4. Nu
    "https://logo.clearbit.com/nu.com.br",
    // 5. American Express
    "https://logo.clearbit.com/americanexpress.com",
    // 6. HSBC
    "https://logo.clearbit.com/hsbc.com.mx",
    // 7. Banco Azteca
    "https://logo.clearbit.com/bancoazteca.com.mx",
    // 8. Scotiabank
    "https://logo.clearbit.com/scotiabank.com.mx",
    // 9. Citibanamex
    "https://logo.clearbit.com/banamex.com",
    // 10. Banregio
    "https://logo.clearbit.com/banregio.com"
];

interface SemiCircleOrbitProps {
    radius: number;
    centerX: number;
    centerY: number;
    icons: string[];
    iconSize: number;
}

const SemiCircleOrbit: React.FC<SemiCircleOrbitProps> = ({ radius, centerX, centerY, icons, iconSize }) => {
    const count = icons.length;

    return (
        <>
            {/* Orbit Line */}
            <div
                className="absolute rounded-full border border-dashed border-earth-primary/20"
                style={{
                    width: radius * 2,
                    height: radius * 2,
                    left: centerX - radius,
                    top: centerY - radius,
                    zIndex: 0
                }}
            />

            {icons.map((icon, index) => {
                const startAngle = 190;
                const endAngle = 350;
                const range = endAngle - startAngle;
                const step = range / (count - 1);
                const currentAngle = startAngle + (index * step);

                const rad = (currentAngle * Math.PI) / 180;
                const x = radius * Math.cos(rad);
                const y = radius * Math.sin(rad);
                const delay = index * 0.2;

                return (
                    <div
                        key={index}
                        className="absolute flex flex-col items-center justify-center group"
                        style={{
                            left: `${centerX + x - iconSize / 2}px`,
                            top: `${centerY + y - iconSize / 2}px`,
                            zIndex: 5,
                        }}
                    >
                        {/* Floating Animation */}
                        <div style={{ animation: `float-y ${3 + (index % 2)}s ease-in-out infinite ${delay}s` }}>
                            <div className="relative rounded-full shadow-md bg-white p-1 flex items-center justify-center overflow-hidden hover:scale-110 transition-transform duration-300 border border-gray-100"
                                style={{ width: iconSize, height: iconSize }}>
                                <img
                                    src={icon}
                                    alt={`Bank ${index}`}
                                    className="w-full h-full object-contain rounded-full"
                                    loading="eager"
                                    onError={(e) => {
                                        // Fallback si falla la imagen
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span style="font-size: 10px; font-weight: bold; color: #555;">$</span>`;
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default function MultiOrbitSemiCircle() {
    const width = 300;
    const height = 220;
    const centerX = width / 2;
    const centerY = height * 0.9;

    // Split icons: 4 for inner, 6 for outer
    const iconsInner = BANK_ICONS.slice(0, 4);
    const iconsOuter = BANK_ICONS.slice(4, 10);

    return (
        <div className="relative w-[300px] h-[220px] mx-auto overflow-hidden flex justify-center md:scale-[1.15] lg:scale-[1.3] origin-bottom">
            <style>{`
          @keyframes float-y {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
        `}</style>

            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-50/50 to-transparent z-0 rounded-full opacity-50"></div>

            {/* Center Hub (Moni Robot) */}
            <div className="absolute left-1/2 top-[90%] transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-16 h-16 bg-earth-primary rounded-2xl shadow-soft flex items-center justify-center text-3xl animate-[pulse_3s_ease-in-out_infinite] border-4 border-white z-20 relative">
                    🤖
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 pointer-events-none">
                    <div className="w-full h-full bg-earth-primary/10 rounded-full animate-ping"></div>
                </div>
            </div>

            <SemiCircleOrbit
                radius={70}
                centerX={centerX}
                centerY={centerY}
                icons={iconsInner}
                iconSize={40}
            />
            <SemiCircleOrbit
                radius={120}
                centerX={centerX}
                centerY={centerY}
                icons={iconsOuter}
                iconSize={48}
            />
        </div>
    );
}
