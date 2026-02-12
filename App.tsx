
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getNoteFromFrequency } from './constants';
import { autoCorrelate } from './services/audioService';
import TunerGauge from './components/TunerGauge';

const App: React.FC = () => {
  const [isTuning, setIsTuning] = useState(false);
  const [tuningData, setTuningData] = useState<{
    note: string;
    octave: number;
    cents: number;
    frequency: number;
  } | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>();
  const wasInTuneRef = useRef(false);

  // Função para gerar o som de sino (ding)
  const playBellSound = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  const startTuning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      
      setIsTuning(true);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Precisamos de acesso ao microfone para afinar o instrumento.");
    }
  };

  const stopTuning = () => {
    setIsTuning(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setTuningData(null);
    wasInTuneRef.current = false;
  };

  const updateTuner = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const freq = autoCorrelate(buffer, audioContextRef.current.sampleRate);

    if (freq !== -1 && freq > 20 && freq < 5000) {
      const result = getNoteFromFrequency(freq);
      const isInTune = Math.abs(result.cents) < 5;

      // Tocar sino se acabou de afinar
      if (isInTune && !wasInTuneRef.current) {
        playBellSound(audioContextRef.current);
      }
      wasInTuneRef.current = isInTune;

      setTuningData({
        note: result.note,
        octave: result.octave,
        cents: result.cents,
        frequency: freq
      });
    } else {
        // Se parou de detectar som, podemos resetar o estado do som para o próximo toque
        // mas com um pequeno atraso ou critério para evitar repetições bobas.
    }

    requestRef.current = requestAnimationFrame(updateTuner);
  }, []);

  useEffect(() => {
    if (isTuning) {
      requestRef.current = requestAnimationFrame(updateTuner);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isTuning, updateTuner]);

  return (
    <div className="flex flex-col h-screen bg-yellow-400 text-black p-6 select-none overflow-hidden">
      {/* Header com Ícone de Passarinho */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="bg-black text-yellow-400 p-2 rounded-xl">
             <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M21 5c-1.11 0-2.06.67-2.48 1.61C17.35 6.23 16.03 6 14.5 6c-3.5 0-6 2.5-6 6 0 1.2.3 2.3.8 3.2l-3.3 3.3c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l3.3-3.3c.9.5 2 .8 3.2.8 3.5 0 6-2.5 6-6 0-1.53-.23-2.85-.61-4.02C20.33 7.06 21 6.11 21 5zM14.5 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
             </svg>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter">CANARINHO</h1>
        </div>
        <div className="bg-black/10 px-3 py-1 rounded-full text-xs font-bold">
          {isTuning ? "ESCUTANDO..." : "EM ESPERA"}
        </div>
      </header>

      {/* Main Tuner Area */}
      <main className="flex-1 flex flex-col items-center justify-center gap-12">
        <div className="text-center">
          <div className="h-32 flex flex-col items-center justify-center">
            {tuningData ? (
              <>
                <div className="text-8xl font-black flex items-start">
                  {tuningData.note}
                  <span className="text-3xl mt-2 ml-1 opacity-50">{tuningData.octave}</span>
                </div>
                <div className="text-sm font-bold opacity-60 mt-2">
                  {tuningData.frequency.toFixed(1)} Hz
                </div>
              </>
            ) : (
              <div className="text-4xl font-black opacity-20 uppercase tracking-widest">
                Toque uma corda
              </div>
            )}
          </div>
        </div>

        <TunerGauge 
          cents={tuningData?.cents || 0} 
          active={isTuning && !!tuningData} 
        />

        {tuningData && (
          <div className={`text-xl font-bold px-8 py-3 rounded-full transition-all duration-300 transform ${
            Math.abs(tuningData.cents) < 5 
              ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-110' 
              : 'bg-black text-yellow-400'
          }`}>
            {Math.abs(tuningData.cents) < 5 
              ? "AFINADO!" 
              : tuningData.cents < 0 ? "APERTAR" : "AFROUXAR"
            }
          </div>
        )}
      </main>

      {/* Controls */}
      <footer className="mt-auto flex justify-center pb-8">
        <button
          onClick={isTuning ? stopTuning : startTuning}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl
            ${isTuning ? 'bg-red-600' : 'bg-black'}
          `}
        >
          {isTuning ? (
            <div className="w-8 h-8 bg-white rounded-sm"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="yellow">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </button>
      </footer>

      {/* Background Decor */}
      <div className="fixed -bottom-20 -left-20 w-64 h-64 bg-black/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed -top-20 -right-20 w-64 h-64 bg-black/5 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default App;
