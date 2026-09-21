import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore';
import {
  X, Plus, Trash2, Trophy, HelpCircle, Check, CheckCircle2,
  XCircle, Award, Sparkles, Edit3, Code, Eye, RefreshCw, Save
} from 'lucide-react';
import { WinnerWheelModal } from './WinnerWheelModal';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(6px)',
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Inter', sans-serif"
};

const panelStyle = {
  backgroundColor: '#161922',
  borderRadius: '16px',
  width: '95%',
  maxWidth: '1350px',
  height: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: '1px solid #334155',
  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
  color: '#fff'
};

const btnPrimary = {
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  color: '#fff',
  border: 'none',
  padding: '0.6rem 1.2rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'all 0.2s'
};

const btnSecondary = {
  background: '#334155',
  color: '#e2e8f0',
  border: 'none',
  padding: '0.6rem 1.2rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'all 0.2s'
};

export const AdminChallenges = ({ close, content, updateContent }) => {
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' or 'maker'
  const [challenges, setChallenges] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [wheelMode, setWheelMode] = useState('single');

  // Challenge Editor State
  const [editingChallenge, setEditingChallenge] = useState(null);

  // 1. Listen to Challenges in Firestore
  useEffect(() => {
    const q = query(collection(db, 'challenges'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setChallenges(list);

      if (list.length > 0 && !selectedChallengeId) {
        setSelectedChallengeId(list[0].id);
      }
    }, (err) => {
      console.error("Firestore challenges error:", err);
    });

    return () => unsubscribe();
  }, [selectedChallengeId]);

  // 2. Listen to Submissions in Firestore
  useEffect(() => {
    const q = query(collection(db, 'challenge_submissions'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setSubmissions(list);
    }, (err) => {
      console.error("Firestore submissions error:", err);
    });

    return () => unsubscribe();
  }, []);

  const currentChallenge = challenges.find(c => c.id === selectedChallengeId) || challenges[0];

  // Filter submissions for current challenge
  const currentSubmissions = submissions.filter(s => {
    if (!selectedChallengeId) return true;
    return s.challengeId === selectedChallengeId;
  });

  const correctSubmissions = currentSubmissions.filter(s => s.isAllCorrect || s.isCorrect);
  const incorrectSubmissions = currentSubmissions.filter(s => !(s.isAllCorrect || s.isCorrect));

  // --- Handlers for Challenges Maker ---
  const handleNewChallenge = () => {
    setEditingChallenge({
      id: '',
      title: 'Gratis Challenge Quiz',
      description: 'Test je kennis over opvoeding en maak kans op een mooie prijs!',
      type: 'quiz', // 'quiz' or 'html'
      htmlCode: '',
      questions: [
        {
          id: 'q_' + Date.now(),
          question: 'Wat is de beste reactie bij een intense driftbui van je kind?',
          options: [
            'Rustig nabij blijven en veiligheid bieden zonder meteen te straffen',
            'Onmiddellijk de stem verheffen zodat het stopt',
            'Het kind direct een half uur naar de gang sturen'
          ],
          correctIndex: 0
        }
      ]
    });
    setActiveTab('maker');
  };

  const handleSaveChallenge = async () => {
    if (!editingChallenge) return;
    if (!editingChallenge.title || editingChallenge.title.trim() === '') {
      alert("Geef de challenge een titel.");
      return;
    }

    try {
      const challengeId = editingChallenge.id || ('ch_' + Date.now());
      const docRef = doc(db, 'challenges', challengeId);
      
      const payload = {
        title: editingChallenge.title.trim(),
        description: editingChallenge.description || '',
        type: editingChallenge.type || 'quiz',
        htmlCode: editingChallenge.htmlCode || '',
        questions: editingChallenge.questions || [],
        updatedAt: serverTimestamp()
      };

      if (!editingChallenge.id) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(docRef, payload, { merge: true });
      setSelectedChallengeId(challengeId);
      setEditingChallenge(null);
      setActiveTab('submissions');
      alert("Challenge succesvol opgeslagen!");
    } catch (err) {
      console.error("Fout bij opslaan challenge:", err);
      alert("Fout bij opslaan: " + err.message);
    }
  };

  const handleDeleteChallenge = async (id, title) => {
    if (window.confirm(`Weet je zeker dat je de challenge "${title}" wilt verwijderen?`)) {
      try {
        await deleteDoc(doc(db, 'challenges', id));
        if (selectedChallengeId === id) {
          setSelectedChallengeId(null);
        }
      } catch (err) {
        console.error("Fout bij verwijderen challenge:", err);
      }
    }
  };

  // --- Questions management inside editor ---
  const addQuestion = () => {
    if (!editingChallenge) return;
    const newQ = {
      id: 'q_' + Date.now(),
      question: 'Nieuwe vraag...',
      options: ['Optie A', 'Optie B'],
      correctIndex: 0
    };
    setEditingChallenge({
      ...editingChallenge,
      questions: [...(editingChallenge.questions || []), newQ]
    });
  };

  const updateQuestion = (index, updates) => {
    if (!editingChallenge) return;
    const qList = [...(editingChallenge.questions || [])];
    qList[index] = { ...qList[index], ...updates };
    setEditingChallenge({ ...editingChallenge, questions: qList });
  };

  const removeQuestion = (index) => {
    if (!editingChallenge) return;
    const qList = (editingChallenge.questions || []).filter((_, i) => i !== index);
    setEditingChallenge({ ...editingChallenge, questions: qList });
  };

  const addOption = (qIndex) => {
    const qList = [...(editingChallenge.questions || [])];
    const opts = [...(qList[qIndex].options || []), `Optie ${(qList[qIndex].options?.length || 0) + 1}`];
    qList[qIndex].options = opts;
    setEditingChallenge({ ...editingChallenge, questions: qList });
  };

  const removeOption = (qIndex, optIndex) => {
    const qList = [...(editingChallenge.questions || [])];
    const opts = (qList[qIndex].options || []).filter((_, i) => i !== optIndex);
    qList[qIndex].options = opts;
    if (qList[qIndex].correctIndex >= opts.length) {
      qList[qIndex].correctIndex = Math.max(0, opts.length - 1);
    }
    setEditingChallenge({ ...editingChallenge, questions: qList });
  };

  // --- Winner Management ---
  const handleSaveWinnersFromWheel = async (winners) => {
    try {
      // First reset winner status on this challenge
      for (const s of currentSubmissions) {
        if (s.winnerStatus) {
          await updateDoc(doc(db, 'challenge_submissions', s.id), {
            winnerStatus: null,
            winnerLabel: null
          });
        }
      }

      // Mark the selected winners
      for (const w of winners) {
        if (w.id) {
          await updateDoc(doc(db, 'challenge_submissions', w.id), {
            winnerStatus: w.rank === 1 ? '1' : w.rank === 2 ? '2' : w.rank === 3 ? '3' : 'winner',
            winnerLabel: w.rankLabel || 'Winnaar'
          });
        }
      }

      setShowWheelModal(false);
      alert("Winnaars succesvol opgeslagen!");
    } catch (err) {
      console.error("Fout bij opslaan winnaars:", err);
      alert("Fout bij opslaan winnaars: " + err.message);
    }
  };

  const handleManualSetRank = async (submissionId, rank) => {
    try {
      const sub = submissions.find(s => s.id === submissionId);
      if (!sub) return;

      const newStatus = sub.winnerStatus === rank ? null : rank;
      const label = newStatus === '1' ? '🥇 1e Plaats' : newStatus === '2' ? '🥈 2e Plaats' : newStatus === '3' ? '🥉 3e Plaats' : newStatus === 'winner' ? '🏆 Winnaar' : null;

      await updateDoc(doc(db, 'challenge_submissions', submissionId), {
        winnerStatus: newStatus,
        winnerLabel: label
      });
    } catch (err) {
      console.error("Fout bij handmatig toewijzen rang:", err);
    }
  };

  const handleResetWinners = async () => {
    if (window.confirm("Weet je zeker dat je alle aangeduide winnaars voor deze challenge wilt wissen?")) {
      try {
        for (const s of currentSubmissions) {
          if (s.winnerStatus) {
            await updateDoc(doc(db, 'challenge_submissions', s.id), {
              winnerStatus: null,
              winnerLabel: null
            });
          }
        }
      } catch (err) {
        console.error("Fout bij resetten:", err);
      }
    }
  };

  return (
    <div style={overlayStyle} onClick={close}>
      <div style={panelStyle} onClick={e => e.stopPropagation()}>
        
        {/* Top Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.2rem 2rem',
            borderBottom: '1px solid #334155',
            background: '#0f172a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Trophy size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                Challenge & Quiz Beheer
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                Maak interactieve challenges of Web3Forms, bekijk antwoorden en kies live winnaars
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', padding: '0.3rem', borderRadius: '10px' }}>
            <button
              onClick={() => { setActiveTab('submissions'); setEditingChallenge(null); }}
              style={{
                background: activeTab === 'submissions' ? '#3b82f6' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1.2rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <Award size={16} /> Deelnames & Winnaars
            </button>

            <button
              onClick={() => { setActiveTab('maker'); if (!editingChallenge && currentChallenge) setEditingChallenge(currentChallenge); }}
              style={{
                background: activeTab === 'maker' ? '#3b82f6' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1.2rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <Edit3 size={16} /> Quiz Maker
            </button>
          </div>

          <button
            onClick={close}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '0.5rem',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ===================== TAB 1: DEELNAMES & WINNAARS ===================== */}
        {activeTab === 'submissions' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1.5rem 2rem' }}>
            
            {/* Top Challenge Switcher & Stats Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#1e293b',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                border: '1px solid #334155',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem' }}>Selecteer Challenge:</span>
                <select
                  value={selectedChallengeId || ''}
                  onChange={e => setSelectedChallengeId(e.target.value)}
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '0.6rem 1rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    minWidth: '220px'
                  }}
                >
                  {challenges.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                  {challenges.length === 0 && <option value="">(Nog geen challenge aangemaakt)</option>}
                </select>

                <button onClick={handleNewChallenge} style={btnSecondary}>
                  <Plus size={16} /> + Nieuwe Challenge
                </button>
              </div>

              {/* Realtime stats badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Totaal Deelnames</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{currentSubmissions.length}</div>
                </div>
                <div style={{ height: '30px', width: '1px', background: '#475569' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#10b981', textTransform: 'uppercase' }}>Correct</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{correctSubmissions.length}</div>
                </div>
                <div style={{ height: '30px', width: '1px', background: '#475569' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#ef4444', textTransform: 'uppercase' }}>Foutief</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>{incorrectSubmissions.length}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar for Winner Selection */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Trophy size={20} /> Winnaar Selectie:
                </span>
                <button
                  onClick={() => { setWheelMode('single'); setShowWheelModal(true); }}
                  disabled={correctSubmissions.length === 0}
                  style={{
                    ...btnPrimary,
                    background: correctSubmissions.length === 0 ? '#475569' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    cursor: correctSubmissions.length === 0 ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  <Sparkles size={16} /> 🎡 Open Draaiend Rad (Live Loting)
                </button>

                <button
                  onClick={() => { setWheelMode('podium'); setShowWheelModal(true); }}
                  disabled={correctSubmissions.length === 0}
                  style={{
                    ...btnSecondary,
                    background: '#1e293b',
                    border: '1px solid #f59e0b',
                    color: '#fbbf24'
                  }}
                >
                  🏆 Top 3 (#1, #2, #3) Rad
                </button>

                {currentSubmissions.some(s => s.winnerStatus) && (
                  <button onClick={handleResetWinners} style={{ ...btnSecondary, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171' }}>
                    <RefreshCw size={14} /> Reset Winnaars
                  </button>
                )}
              </div>

              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                💡 <em>Tip: Klik op het Draaiend Rad om live op groot scherm een winnaar te kiezen!</em>
              </div>
            </div>

            {/* Split View Columns: Left Incorrect, Right Correct */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', overflow: 'hidden' }}>
              
              {/* --- LEFT COLUMN: FOUTIEVE ANTWOORDEN --- */}
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    padding: '0.8rem 1.2rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                    <XCircle size={18} /> Foutieve Antwoorden ({incorrectSubmissions.length})
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>Geen winnaar kans</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {incorrectSubmissions.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      Geen foutieve antwoorden geregistreerd.
                    </div>
                  ) : (
                    incorrectSubmissions.map(sub => (
                      <div
                        key={sub.id}
                        style={{
                          background: '#1e293b',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '8px',
                          padding: '0.9rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{sub.name}</span>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{sub.email} {sub.phone ? `• ${sub.phone}` : ''}</div>
                          </div>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                            {sub.correctCount ?? 0} / {sub.totalQuestions ?? 1} juist
                          </span>
                        </div>

                        {/* Answers breakdown */}
                        <div style={{ borderTop: '1px solid #334155', paddingTop: '0.5rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {(sub.answers || []).map((ans, idx) => (
                            <div key={idx} style={{ color: ans.isCorrect ? '#10b981' : '#f87171' }}>
                              {ans.isCorrect ? '✔' : '✖'} <strong>V{idx + 1}:</strong> {ans.givenAnswer || 'Geen antwoord'}
                              {!ans.isCorrect && ans.correctAnswer && (
                                <span style={{ color: '#94a3b8', marginLeft: '6px' }}>(Juist: {ans.correctAnswer})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* --- RIGHT COLUMN: CORRECTE ANTWOORDEN (WINNAARS KANDIDATEN) --- */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    padding: '0.8rem 1.2rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} /> Correcte Deelnemers ({correctSubmissions.length})
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>Kwalificatie voor winactie</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {correctSubmissions.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      Nog geen deelnemers met alle antwoorden juist.
                    </div>
                  ) : (
                    correctSubmissions.map(sub => {
                      const isWinner = !!sub.winnerStatus;
                      return (
                        <div
                          key={sub.id}
                          style={{
                            background: isWinner ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, #1e293b 100%)' : '#1e293b',
                            border: isWinner ? '2px solid #f59e0b' : '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: '10px',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.6rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>{sub.name}</span>
                                {isWinner && (
                                  <span
                                    style={{
                                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                      color: '#fff',
                                      padding: '0.2rem 0.6rem',
                                      borderRadius: '20px',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                                    }}
                                  >
                                    {sub.winnerLabel || '🏆 Winnaar'}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                {sub.email} {sub.phone ? `• ${sub.phone}` : ''}
                              </div>
                            </div>

                            {/* Manual Rank Assignment Buttons (#1, #2, #3, Winnaar) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <button
                                onClick={() => handleManualSetRank(sub.id, '1')}
                                title="Wijs 1e plaats toe"
                                style={{
                                  background: sub.winnerStatus === '1' ? '#f59e0b' : '#334155',
                                  color: sub.winnerStatus === '1' ? '#000' : '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                🥇 1
                              </button>

                              <button
                                onClick={() => handleManualSetRank(sub.id, '2')}
                                title="Wijs 2e plaats toe"
                                style={{
                                  background: sub.winnerStatus === '2' ? '#94a3b8' : '#334155',
                                  color: sub.winnerStatus === '2' ? '#000' : '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                🥈 2
                              </button>

                              <button
                                onClick={() => handleManualSetRank(sub.id, '3')}
                                title="Wijs 3e plaats toe"
                                style={{
                                  background: sub.winnerStatus === '3' ? '#b45309' : '#334155',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                🥉 3
                              </button>

                              <button
                                onClick={() => handleManualSetRank(sub.id, 'winner')}
                                title="Duid aan als winnaar"
                                style={{
                                  background: sub.winnerStatus === 'winner' ? '#10b981' : '#334155',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                👑
                              </button>
                            </div>
                          </div>

                          {/* Antwoorden weergeven */}
                          <div style={{ borderTop: '1px solid #334155', paddingTop: '0.4rem', fontSize: '0.8rem', color: '#10b981' }}>
                            {sub.type === 'inschrijving' || !sub.answers || sub.answers.length === 0 ? (
                              <div style={{ color: '#38bdf8' }}>📝 Aanmelding / Inschrijving voor de Challenge</div>
                            ) : (
                              (sub.answers || []).map((ans, idx) => (
                                <div key={idx}>
                                  ✔ <strong>V{idx + 1}:</strong> {ans.givenAnswer}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ===================== TAB 2: QUIZ & CHALLENGE MAKER ===================== */}
        {activeTab === 'maker' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '1.5rem 2rem', gap: '2rem' }}>
            
            {/* Left: Challenge List sidebar */}
            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderRight: '1px solid #334155', paddingRight: '1.5rem' }}>
              <button onClick={handleNewChallenge} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>
                <Plus size={16} /> + Nieuwe Challenge
              </button>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {challenges.map(c => (
                  <div
                    key={c.id}
                    onClick={() => { setSelectedChallengeId(c.id); setEditingChallenge(c); }}
                    style={{
                      padding: '0.9rem',
                      borderRadius: '8px',
                      background: selectedChallengeId === c.id ? '#3b82f6' : '#1e293b',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #334155',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.title}</div>
                      <div style={{ fontSize: '0.75rem', color: selectedChallengeId === c.id ? '#dbeafe' : '#94a3b8' }}>
                        {c.type === 'html' ? 'HTML / Web3Forms' : `${c.questions?.length || 0} Vragen`}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteChallenge(c.id, c.title); }}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.3rem' }}
                      title="Verwijder challenge"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Challenge Editor Form */}
            {editingChallenge ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '1rem', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
                    {editingChallenge.id ? 'Challenge Bewerken' : 'Nieuwe Challenge Aanmaken'}
                  </h3>
                  <button onClick={handleSaveChallenge} style={btnPrimary}>
                    <Save size={16} /> Challenge Opslaan
                  </button>
                </div>

                {/* General Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Titel van de Challenge / Quiz
                    </label>
                    <input
                      type="text"
                      value={editingChallenge.title || ''}
                      onChange={e => setEditingChallenge({ ...editingChallenge, title: e.target.value })}
                      placeholder="bijv. Gratis 5-Daagse Challenge Quiz"
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', padding: '0.8rem', color: '#fff', fontSize: '1rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Korte Omschrijving / Instructie voor de deelnemer
                    </label>
                    <textarea
                      value={editingChallenge.description || ''}
                      onChange={e => setEditingChallenge({ ...editingChallenge, description: e.target.value })}
                      placeholder="bijv. Beantwoord de vragen en maak kans op een gratis coachingstraject..."
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', padding: '0.8rem', color: '#fff', fontSize: '0.95rem', minHeight: '80px' }}
                    />
                  </div>

                  {/* Challenge Type Choice */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                      Type Challenge:
                    </label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: editingChallenge.type === 'quiz' ? 'rgba(59, 130, 246, 0.2)' : '#0f172a', border: editingChallenge.type === 'quiz' ? '1px solid #3b82f6' : '1px solid #334155', padding: '0.8rem 1.2rem', borderRadius: '8px' }}>
                        <input
                          type="radio"
                          name="c_type"
                          value="quiz"
                          checked={editingChallenge.type === 'quiz'}
                          onChange={() => setEditingChallenge({ ...editingChallenge, type: 'quiz' })}
                        />
                        <span style={{ fontWeight: 600 }}>Ingebouwde Quiz (Vragen & Juist Antwoord)</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: editingChallenge.type === 'html' ? 'rgba(59, 130, 246, 0.2)' : '#0f172a', border: editingChallenge.type === 'html' ? '1px solid #3b82f6' : '1px solid #334155', padding: '0.8rem 1.2rem', borderRadius: '8px' }}>
                        <input
                          type="radio"
                          name="c_type"
                          value="html"
                          checked={editingChallenge.type === 'html'}
                          onChange={() => setEditingChallenge({ ...editingChallenge, type: 'html' })}
                        />
                        <span style={{ fontWeight: 600 }}>Web3Forms / Aangepaste HTML code</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Option A: Web3Forms HTML code */}
                {editingChallenge.type === 'html' && (
                  <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      Plak hier de HTML code van Web3Forms:
                    </label>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      Kopieer de formulier- of iframe-code die je van Web3Forms gekregen hebt en plak deze hier. Deze wordt geopend in een pop-up zodra een bezoeker op de challenge knop klikt.
                    </p>
                    <textarea
                      value={editingChallenge.htmlCode || ''}
                      onChange={e => setEditingChallenge({ ...editingChallenge, htmlCode: e.target.value })}
                      placeholder="<form action='https://api.web3forms.com/submit' method='POST'>&#10;  ...&#10;</form>"
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', padding: '1rem', color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.9rem', minHeight: '220px' }}
                    />
                  </div>
                )}

                {/* Option B: Built-in Quiz Questions */}
                {editingChallenge.type === 'quiz' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Vragen & Juiste Antwoorden ({editingChallenge.questions?.length || 0})
                      </h4>
                      <button onClick={addQuestion} style={btnSecondary}>
                        <Plus size={16} /> + Vraag Toevoegen
                      </button>
                    </div>

                    {(editingChallenge.questions || []).map((q, qIndex) => (
                      <div
                        key={q.id || qIndex}
                        style={{
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.95rem' }}>
                            VRAAG {qIndex + 1}
                          </span>
                          <button
                            onClick={() => removeQuestion(qIndex)}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                          >
                            <Trash2 size={16} /> Verwijder vraag
                          </button>
                        </div>

                        <input
                          type="text"
                          value={q.question || ''}
                          onChange={e => updateQuestion(qIndex, { question: e.target.value })}
                          placeholder="Typ hier de vraag..."
                          style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', padding: '0.8rem', color: '#fff', fontSize: '1rem', fontWeight: 600 }}
                        />

                        {/* Options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                          <label style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                            Antwoordopties (Selecteer het rondje bij het JUISTE antwoord):
                          </label>

                          {(q.options || []).map((opt, optIndex) => {
                            const isCorrect = q.correctIndex === optIndex;
                            return (
                              <div
                                key={optIndex}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.8rem',
                                  background: isCorrect ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
                                  border: isCorrect ? '1px solid #10b981' : '1px solid #334155',
                                  padding: '0.6rem 1rem',
                                  borderRadius: '8px'
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`correct_opt_${qIndex}`}
                                  checked={isCorrect}
                                  onChange={() => updateQuestion(qIndex, { correctIndex: optIndex })}
                                  title="Duid aan als juist antwoord"
                                  style={{ accentColor: '#10b981', width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={e => {
                                    const opts = [...q.options];
                                    opts[optIndex] = e.target.value;
                                    updateQuestion(qIndex, { options: opts });
                                  }}
                                  style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                                />
                                {isCorrect && (
                                  <span style={{ fontSize: '0.75rem', background: '#10b981', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                                    JUIST ANTWOORD
                                  </span>
                                )}
                                {(q.options || []).length > 2 && (
                                  <button
                                    onClick={() => removeOption(qIndex, optIndex)}
                                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                                    title="Optie verwijderen"
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          <button
                            onClick={() => addOption(qIndex)}
                            style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #475569', color: '#94a3b8', borderRadius: '6px', padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', marginTop: '0.3rem' }}
                          >
                            + Optie toevoegen
                          </button>
                        </div>
                      </div>
                    ))}

                    <button onClick={addQuestion} style={{ ...btnSecondary, alignSelf: 'center', padding: '0.8rem 2rem' }}>
                      <Plus size={18} /> + Nog een vraag toevoegen
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                Selecteer een challenge links of maak een nieuwe aan om te beginnen.
              </div>
            )}
          </div>
        )}

        {/* --- FULLSCREEN WINNER WHEEL MODAL --- */}
        {showWheelModal && (
          <WinnerWheelModal
            participants={correctSubmissions}
            onSaveWinners={handleSaveWinnersFromWheel}
            close={() => setShowWheelModal(false)}
          />
        )}

      </div>
    </div>
  );
};
