
import React from 'react';

interface TunerGaugeProps {
  cents: number;
  active: boolean;
}

const TunerGauge: React.FC<TunerGaugeProps> = ({ cents, active }) => {
  // Map cents (-50 to 50) to degrees (-60 to 60)
  // 0 cents = 0 degrees (vertical)
  const rotation = active ? Math.max(-60, Math.min(60, (cents / 50) * 60)) : 0;
  
  // Color logic
  const isInTune = Math.abs(cents) < 5;
  const needleColor = !active ? 'bg-black' : (isInTune ? 'bg-green-500' : 'bg-red-600');
  const shadowColor = !active ? 'shadow-none' : (isInTune ? 'shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'shadow-[0_0_15px_rgba(220,38,38,0.4)]');

  return (
    <div className="relative w-full max-w-sm aspect-[2/1] flex flex-col items-center justify-end overflow-hidden">
      {/* Gauge Background Curve */}
      <div className="absolute bottom-0 w-[140%] aspect-square border-[12px] border-black rounded-full opacity-10 pointer-events-none"></div>
      
      {/* Markings */}
      <div className="absolute inset-x-0 bottom-4 flex justify-between px-12 text-black font-black text-xs opacity-50">
        <span>-50</span>
        <span>0</span>
        <span>+50</span>
      </div>

      {/* Ticks Container */}
      <div className="absolute bottom-0 w-full h-full pointer-events-none">
        {Array.from({ length: 11 }).map((_, i) => {
          const angle = (i - 5) * 12; // -60 to 60
          return (
            <div 
              key={i}
              className="absolute bottom-0 left-1/2 w-1 h-6 bg-black origin-bottom"
              style={{ 
                transform: `translateX(-50%) rotate(${angle}deg) translateY(-140px)`,
                opacity: i === 5 ? 1 : 0.3
              }}
            />
          );
        })}
      </div>

      {/* The Needle */}
      <div 
        className={`absolute bottom-0 left-1/2 w-1.5 h-40 origin-bottom transition-all duration-150 ease-out rounded-full ${needleColor} ${shadowColor}`}
        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
      >
        <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full ${needleColor}`}></div>
      </div>

      {/* Pivot Point */}
      <div className="w-8 h-8 rounded-full bg-black border-4 border-yellow-400 z-10 -mb-4"></div>
    </div>
  );
};

export default TunerGauge;
