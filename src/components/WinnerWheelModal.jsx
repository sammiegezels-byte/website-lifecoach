import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Sparkles, RefreshCw, Volume2, VolumeX, Maximize2, Minimize2, Award, Check } from 'lucide-react';

// Web Audio API sound generator for authentic clicking & fanfare without external files
const playTickSound = (audioCtx) => {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch {
    // Ignore audio failures if browser restricted
  }
};

const playFanfareSound = (audioCtx) => {
  if (!audioCtx) return;
  try {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.12);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.12 + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + index * 0.12);
      osc.stop(audioCtx.currentTime + index * 0.12 + 0.8);
    });
  } catch {
    // Ignore
  }
};

// Canvas confetti generator
const ConfettiCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#fbbf24', '#ffffff'];
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 3,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 10
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        ctx.restore();
      });
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 100005
      }}
    />
  );
};

export const WinnerWheelModal = ({ participants = [], onSaveWinners, close }) => {
  const [wheelMode, setWheelMode] = useState('single'); // 'single', 'multi', 'podium'
  const [multiCount, setMultiCount] = useState(2);
  const [isSpinning, setIsSpinning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [revealedWinners, setRevealedWinners] = useState(null); // array of { name, email, rank, rankLabel }
  const [activeShuffleName, setActiveShuffleName] = useState('');
  const [wheelRotation, setWheelRotation] = useState(0);

  const audioCtxRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize audio context on first user click
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const namesList = participants.map(p => p.name || 'Deelnemer');
  const distinctNames = namesList.length > 0 ? namesList : ['Geen deelnemers'];

  // Pastel vibrant colors for wheel segments
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', 
    '#06B6D4', '#F97316', '#84CC16', '#E11D48', '#14B8A6'
  ];

  const startSpin = () => {
    if (isSpinning || participants.length === 0) return;

    const actx = soundEnabled ? getAudioCtx() : null;
    setIsSpinning(true);
    setRevealedWinners(null);

    // Pick winners randomly from participants
    let shuffled = [...participants].sort(() => 0.5 - Math.random());
    let winners = [];

    if (wheelMode === 'podium') {
      const topCount = Math.min(3, shuffled.length);
      winners = shuffled.slice(0, topCount).map((p, idx) => ({
        ...p,
        rank: idx + 1,
        rankLabel: idx === 0 ? '🥇 1e Plaats' : idx === 1 ? '🥈 2e Plaats' : '🥉 3e Plaats'
      }));
    } else if (wheelMode === 'multi') {
      const count = Math.min(Math.max(1, multiCount), shuffled.length);
      winners = shuffled.slice(0, count).map((p, idx) => ({
        ...p,
        rank: idx + 1,
        rankLabel: `Winnaar ${idx + 1}`
      }));
    } else {
      winners = [{
        ...shuffled[0],
        rank: 1,
        rankLabel: '🏆 Winnaar'
      }];
    }

    // Determine target slice on the wheel for primary winner
    const winnerIndex = participants.findIndex(p => p.id === winners[0]?.id || p.name === winners[0]?.name);
    const sliceAngle = 360 / participants.length;
    const targetSliceAngle = (winnerIndex >= 0 ? winnerIndex : 0) * sliceAngle;
    
    // Add multiple full rotations (e.g. 6 to 8 spins)
    const extraRotations = 360 * 7;
    // Align with top pointer at 270deg / 0deg
    const finalAngle = wheelRotation + extraRotations + (360 - (targetSliceAngle % 360));

    setWheelRotation(finalAngle);

    // Rapid shuffle name ticker while wheel is spinning
    let shuffleInterval;
    let tickInterval;
    let elapsed = 0;
    const duration = 5500; // 5.5 seconds spin

    shuffleInterval = setInterval(() => {
      const randomName = participants[Math.floor(Math.random() * participants.length)]?.name;
      if (randomName) setActiveShuffleName(randomName);
    }, 80);

    // Sound ticks
    if (soundEnabled && actx) {
      let tickDelay = 70;
      const tickLoop = () => {
        playTickSound(actx);
        elapsed += tickDelay;
        if (elapsed < duration) {
          tickDelay = Math.min(450, tickDelay * 1.05); // Slow down ticker gradually
          tickInterval = setTimeout(tickLoop, tickDelay);
        }
      };
      tickLoop();
    }

    // Reveal after 5.5s
    setTimeout(() => {
      clearInterval(shuffleInterval);
      clearTimeout(tickInterval);
      setIsSpinning(false);
      setActiveShuffleName(winners[0]?.name || '');
      setRevealedWinners(winners);

      if (soundEnabled && actx) {
        playFanfareSound(actx);
      }
    }, duration);
  };

  const handleSaveAndConfirm = () => {
    if (revealedWinners && onSaveWinners) {
      onSaveWinners(revealedWinners);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0a0d14',
        backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, #0a0d14 100%)',
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden'
      }}
    >
      {revealedWinners && <ConfettiCanvas />}

      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.2rem 2.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)'
            }}
          >
            <Trophy size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, letterSpacing: '1px' }}>
              CHALLENGE WINNAAR LOTING
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              Draai aan het rad en kies live de winnaar(s) uit de correcte antwoorden
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={soundEnabled ? 'Geluid dempen' : 'Geluid aanzetten'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isFullscreen ? 'Venster verkleinen' : 'Volledig scherm'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>

          <button
            onClick={close}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '0.6rem 1rem',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600
            }}
          >
            <X size={18} /> Sluiten
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '2rem'
        }}
      >
        {/* Mode Selector & Controls (Shown when not currently spinning) */}
        <div
          style={{
            position: 'absolute',
            top: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'rgba(30, 41, 59, 0.8)',
            padding: '0.6rem 1.2rem',
            borderRadius: '50px',
            border: '1px solid rgba(255,255,255,0.1)',
            zIndex: 10
          }}
        >
          <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>Lootmodus:</span>
          
          <button
            onClick={() => { setWheelMode('single'); setRevealedWinners(null); }}
            disabled={isSpinning}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              border: 'none',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 600,
              background: wheelMode === 'single' ? '#f59e0b' : 'transparent',
              color: wheelMode === 'single' ? '#000' : '#cbd5e1',
              transition: 'all 0.2s'
            }}
          >
            1 Winnaar
          </button>

          <button
            onClick={() => { setWheelMode('multi'); setRevealedWinners(null); }}
            disabled={isSpinning}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              border: 'none',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 600,
              background: wheelMode === 'multi' ? '#f59e0b' : 'transparent',
              color: wheelMode === 'multi' ? '#000' : '#cbd5e1',
              transition: 'all 0.2s'
            }}
          >
            Meerdere Winnaars
          </button>

          {wheelMode === 'multi' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Aantal:</span>
              <input
                type="number"
                min="2"
                max={Math.max(2, participants.length)}
                value={multiCount}
                onChange={(e) => setMultiCount(parseInt(e.target.value) || 2)}
                disabled={isSpinning}
                style={{
                  width: '50px',
                  background: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#fff',
                  textAlign: 'center',
                  padding: '0.2rem'
                }}
              />
            </div>
          )}

          <button
            onClick={() => { setWheelMode('podium'); setRevealedWinners(null); }}
            disabled={isSpinning}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              border: 'none',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 600,
              background: wheelMode === 'podium' ? '#f59e0b' : 'transparent',
              color: wheelMode === 'podium' ? '#000' : '#cbd5e1',
              transition: 'all 0.2s'
            }}
          >
            🏆 Top 3 (#1, #2, #3)
          </button>
        </div>

        {/* Center: Interactive Wheel / Display Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          
          {/* Wheel Graphic Container */}
          <div
            style={{
              position: 'relative',
              width: '420px',
              height: '420px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Top Indicator Arrow */}
            <div
              style={{
                position: 'absolute',
                top: '-18px',
                zIndex: 20,
                width: 0,
                height: 0,
                borderLeft: '18px solid transparent',
                borderRight: '18px solid transparent',
                borderTop: '32px solid #ef4444',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
              }}
            />

            {/* Glowing Outer Ring */}
            <div
              style={{
                position: 'absolute',
                width: '440px',
                height: '440px',
                borderRadius: '50%',
                border: '8px solid rgba(245, 158, 11, 0.4)',
                boxShadow: isSpinning
                  ? '0 0 50px rgba(245, 158, 11, 0.8), inset 0 0 30px rgba(245, 158, 11, 0.4)'
                  : '0 0 25px rgba(245, 158, 11, 0.2)',
                transition: 'box-shadow 0.3s ease'
              }}
            />

            {/* The SVG Wheel */}
            <div
              style={{
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                overflow: 'hidden',
                position: 'relative',
                transform: `rotate(${wheelRotation}deg)`,
                transition: isSpinning ? 'transform 5.5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
              }}
            >
              <svg width="400" height="400" viewBox="0 0 400 400">
                {participants.length === 0 ? (
                  <circle cx="200" cy="200" r="200" fill="#334155" />
                ) : (
                  participants.map((p, i) => {
                    const total = participants.length;
                    const angle = 360 / total;
                    const startAngle = i * angle;
                    const endAngle = (i + 1) * angle;

                    const rad1 = ((startAngle - 90) * Math.PI) / 180;
                    const rad2 = ((endAngle - 90) * Math.PI) / 180;

                    const x1 = 200 + 200 * Math.cos(rad1);
                    const y1 = 200 + 200 * Math.sin(rad1);
                    const x2 = 200 + 200 * Math.cos(rad2);
                    const y2 = 200 + 200 * Math.sin(rad2);

                    const largeArc = angle > 180 ? 1 : 0;
                    const pathData = `M 200 200 L ${x1} ${y1} A 200 200 0 ${largeArc} 1 ${x2} ${y2} Z`;

                    // Text rotation
                    const textAngle = startAngle + angle / 2;
                    const textRad = ((textAngle - 90) * Math.PI) / 180;
                    const tx = 200 + 130 * Math.cos(textRad);
                    const ty = 200 + 130 * Math.sin(textRad);

                    return (
                      <g key={p.id || i}>
                        <path d={pathData} fill={colors[i % colors.length]} stroke="#1e293b" strokeWidth="2" />
                        <text
                          x={tx}
                          y={ty}
                          fill="#ffffff"
                          fontSize={total > 15 ? '10' : total > 8 ? '12' : '14'}
                          fontWeight="700"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)', pointerEvents: 'none' }}
                        >
                          {(p.name || '').length > 12 ? (p.name || '').slice(0, 10) + '..' : p.name}
                        </text>
                      </g>
                    );
                  })
                )}
              </svg>
            </div>

            {/* Center Golden Pin */}
            <div
              style={{
                position: 'absolute',
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                border: '4px solid #fff',
                boxShadow: '0 0 20px rgba(0,0,0,0.6)',
                zIndex: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onClick={startSpin}
            >
              <Sparkles size={28} color="#fff" />
            </div>
          </div>

          {/* Dynamic Live Shuffle Name Ticker */}
          {isSpinning && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                border: '2px solid #f59e0b',
                padding: '0.8rem 2.5rem',
                borderRadius: '50px',
                fontSize: '1.8rem',
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#fbbf24',
                textShadow: '0 0 15px rgba(245, 158, 11, 0.8)'
              }}
            >
              🎲 {activeShuffleName || 'Spannend...'}
            </motion.div>
          )}

          {/* Giant START Button */}
          {!isSpinning && !revealedWinners && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startSpin}
              disabled={participants.length === 0}
              style={{
                background: participants.length === 0
                  ? '#475569'
                  : 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                color: '#fff',
                border: 'none',
                padding: '1.2rem 3.5rem',
                fontSize: '1.5rem',
                fontWeight: 800,
                borderRadius: '50px',
                cursor: participants.length === 0 ? 'not-allowed' : 'pointer',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem'
              }}
            >
              <Sparkles size={26} /> START HET RAD!
            </motion.button>
          )}

          {/* Number of participants info */}
          {!isSpinning && !revealedWinners && (
            <div style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '-0.5rem' }}>
              🎯 <strong>{participants.length}</strong> deelnemers met een correct antwoord
            </div>
          )}
        </div>

        {/* --- REVEALED WINNERS OVERLAY (HUGE DISPLAY ON SCREEN) --- */}
        <AnimatePresence>
          {revealedWinners && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 15, stiffness: 100 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxWidth: '900px',
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.97) 0%, rgba(15, 23, 42, 0.98) 100%)',
                border: '3px solid #f59e0b',
                borderRadius: '30px',
                padding: '3.5rem 2.5rem',
                textAlign: 'center',
                boxShadow: '0 25px 80px rgba(0,0,0,0.8), 0 0 60px rgba(245, 158, 11, 0.4)',
                zIndex: 100006
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.6 }}
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  letterSpacing: '4px',
                  color: '#fbbf24',
                  textTransform: 'uppercase',
                  marginBottom: '1rem'
                }}
              >
                ✨ PROFICIAT! ✨
              </motion.div>

              {/* Display Winners Cards */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: wheelMode === 'podium' ? 'row' : 'column',
                  flexWrap: 'wrap',
                  gap: '1.5rem',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '2rem 0'
                }}
              >
                {revealedWinners.map((w, index) => (
                  <motion.div
                    key={w.id || index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 + 0.3 }}
                    style={{
                      background: w.rank === 1
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)'
                        : 'rgba(255,255,255,0.05)',
                      border: w.rank === 1 ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '20px',
                      padding: '1.8rem 2.5rem',
                      minWidth: wheelMode === 'podium' ? '220px' : '320px',
                      boxShadow: w.rank === 1 ? '0 10px 30px rgba(245, 158, 11, 0.3)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transform: w.rank === 1 && wheelMode === 'podium' ? 'scale(1.08)' : 'none'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: w.rank === 1 ? '#fbbf24' : '#e2e8f0',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      {w.rankLabel}
                    </div>

                    {/* HUGE NAME */}
                    <div
                      style={{
                        fontSize: wheelMode === 'single' ? '3.8rem' : '2.6rem',
                        fontWeight: 900,
                        letterSpacing: '1px',
                        color: '#fff',
                        lineHeight: 1.2,
                        margin: '0.5rem 0',
                        textShadow: '0 4px 20px rgba(0,0,0,0.6)'
                      }}
                    >
                      {w.name}
                    </div>

                    {w.email && (
                      <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                        {w.email} {w.phone ? `• ${w.phone}` : ''}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Buttons under reveal */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '2.5rem' }}>
                <button
                  onClick={handleSaveAndConfirm}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '1rem 2.5rem',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Check size={22} /> Opslaan in Resultaten
                </button>

                <button
                  onClick={() => { setRevealedWinners(null); startSpin(); }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <RefreshCw size={18} /> Opnieuw Draaien
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
