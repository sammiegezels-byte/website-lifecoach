import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, serverTimestamp, query, orderBy, limit
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRight, ArrowLeft, Trophy, Sparkles, AlertCircle } from 'lucide-react';

export const ChallengeModal = ({ challengeId, customHtml, buttonLabel, actionType, close }) => {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0); // 0 = details (name/email), 1..N = questions, 999 = done
  const [participant, setParticipant] = useState({ name: '', email: '', phone: '' });
  const [userAnswers, setUserAnswers] = useState({}); // { [qIndex]: selectedOptionIndex }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultScore, setResultScore] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch challenge data
  useEffect(() => {
    if (customHtml) {
      setLoading(false);
      return;
    }

    const fetchChallenge = async () => {
      try {
        if (challengeId) {
          const docSnap = await getDoc(doc(db, 'challenges', challengeId));
          if (docSnap.exists()) {
            setChallenge({ id: docSnap.id, ...docSnap.data() });
            setLoading(false);
            return;
          }
        }

        // Fallback: fetch most recent challenge
        const q = query(collection(db, 'challenges'), orderBy('createdAt', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const first = snap.docs[0];
          setChallenge({ id: first.id, ...first.data() });
        } else {
          // Default fallback challenge
          setChallenge({
            id: 'default_challenge',
            title: 'Challenge Inschrijving',
            description: 'Meld je aan voor de challenge en ontvang alle updates en materialen in je mailbox.',
            type: 'quiz',
            questions: []
          });
        }
      } catch (err) {
        console.error("Fout bij ophalen challenge:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [challengeId, customHtml]);

  // If HTML/Web3Forms embed mode
  if (customHtml || (challenge && challenge.type === 'html' && challenge.htmlCode)) {
    const rawHtml = customHtml || challenge.htmlCode;
    return (
      <div style={modalOverlayStyle} onClick={close}>
        <div style={{ ...modalContainerStyle, maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.4rem', fontWeight: 'bold' }}>
              {buttonLabel || challenge?.title || 'Inschrijving'}
            </h3>
            <button onClick={close} style={closeBtnStyle}><X size={20} /></button>
          </div>

          <div
            style={{ width: '100%', overflowY: 'auto', maxHeight: '75vh', padding: '0.5rem' }}
            dangerouslySetInnerHTML={{ __html: rawHtml }}
          />
        </div>
      </div>
    );
  }

  const questions = challenge?.questions || [];
  const isDirectSignup = actionType === 'signup' || questions.length === 0;

  // Handle participant info submission
  const handleStartOrSubmit = async (e) => {
    e.preventDefault();
    if (!participant.name.trim()) {
      setErrorMsg('Vul alsjeblieft je naam in.');
      return;
    }
    if (!participant.email.trim() || !participant.email.includes('@')) {
      setErrorMsg('Vul een geldig e-mailadres in.');
      return;
    }
    setErrorMsg('');

    if (isDirectSignup) {
      // Direct registration mode
      setIsSubmitting(true);
      try {
        await addDoc(collection(db, 'challenge_submissions'), {
          challengeId: challenge?.id || 'algemeen',
          challengeTitle: challenge?.title || buttonLabel || 'Challenge Inschrijving',
          name: participant.name.trim(),
          email: participant.email.trim().toLowerCase(),
          phone: participant.phone?.trim() || '',
          type: 'inschrijving',
          answers: [],
          correctCount: 1,
          totalQuestions: 1,
          isAllCorrect: true,
          submittedAt: serverTimestamp(),
          winnerStatus: null
        });
        setResultScore({ isSignup: true });
        setStep(999);
      } catch (err) {
        console.error("Fout bij opslaan inschrijving:", err);
        setErrorMsg("Er ging iets mis bij het verzenden: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Move to question 1
      setStep(1);
    }
  };

  const currentQIndex = step - 1;
  const currentQ = questions[currentQIndex];

  const handleSelectOption = (optIndex) => {
    setUserAnswers({
      ...userAnswers,
      [currentQIndex]: optIndex
    });
  };

  const handleNextOrSubmit = async () => {
    if (userAnswers[currentQIndex] === undefined) {
      setErrorMsg('Kies alsjeblieft een antwoord voor je verdergaat.');
      return;
    }
    setErrorMsg('');

    if (step < questions.length) {
      setStep(step + 1);
    } else {
      // Final submit!
      setIsSubmitting(true);
      try {
        let correctCount = 0;
        const answersBreakdown = questions.map((q, idx) => {
          const chosenIdx = userAnswers[idx];
          const isCorrect = chosenIdx === q.correctIndex;
          if (isCorrect) correctCount++;
          return {
            question: q.question,
            givenAnswer: q.options[chosenIdx] || 'Geen antwoord',
            correctAnswer: q.options[q.correctIndex] || '',
            isCorrect
          };
        });

        const isAllCorrect = correctCount === questions.length;

        // Save to Firestore
        await addDoc(collection(db, 'challenge_submissions'), {
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          name: participant.name.trim(),
          email: participant.email.trim().toLowerCase(),
          phone: participant.phone?.trim() || '',
          answers: answersBreakdown,
          correctCount,
          totalQuestions: questions.length,
          isAllCorrect,
          submittedAt: serverTimestamp(),
          winnerStatus: null
        });

        setResultScore({ correctCount, totalQuestions: questions.length, isAllCorrect });
        setStep(999); // Completed screen
      } catch (err) {
        console.error("Fout bij indienen quiz:", err);
        alert("Er is een fout opgetreden bij het verzenden: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div style={modalOverlayStyle} onClick={close}>
      <div style={modalContainerStyle} onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button onClick={close} style={closeBtnStyle}><X size={22} /></button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '1.2rem', color: '#666' }}>Challenge wordt geladen...</div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* STEP 0: PARTICIPANT FORM */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ textAlign: 'center' }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    color: '#fff',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  <Trophy size={32} />
                </div>

                <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary)', marginBottom: '0.8rem', fontWeight: 800 }}>
                  {challenge.title}
                </h2>

                <p style={{ color: '#555', fontSize: '1.05rem', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 2rem' }}>
                  {challenge.description || 'Vul je gegevens in om mee te doen aan deze challenge en kans te maken op de winactie!'}
                </p>

                {errorMsg && (
                  <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <AlertCircle size={18} /> {errorMsg}
                  </div>
                )}

                <form onSubmit={handleStartOrSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '420px', margin: '0 auto' }}>
                  <input
                    type="text"
                    placeholder="Jouw volledige naam *"
                    value={participant.name}
                    onChange={e => setParticipant({ ...participant, name: e.target.value })}
                    required
                    style={formInputStyle}
                  />

                  <input
                    type="email"
                    placeholder="Jouw e-mailadres *"
                    value={participant.email}
                    onChange={e => setParticipant({ ...participant, email: e.target.value })}
                    required
                    style={formInputStyle}
                  />

                  <input
                    type="tel"
                    placeholder="Telefoonnummer (optioneel)"
                    value={participant.phone}
                    onChange={e => setParticipant({ ...participant, phone: e.target.value })}
                    style={formInputStyle}
                  />

                  <button type="submit" className="btn" disabled={isSubmitting} style={{ marginTop: '0.5rem', fontSize: '1.1rem', padding: '1rem' }}>
                    {isSubmitting ? 'Bezig met verwerken...' : isDirectSignup ? 'Inschrijving Bevestigen' : 'Start de Challenge \u2192'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 1..N: QUESTIONS */}
            {step > 0 && step !== 999 && currentQ && (
              <motion.div
                key={`step${step}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                {/* Progress bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Vraag {step} van {questions.length}
                  </span>
                  <div style={{ width: '120px', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(step / questions.length) * 100}%`,
                        height: '100%',
                        background: 'var(--color-primary)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '1.5rem', lineHeight: '1.5', fontWeight: 700 }}>
                  {currentQ.question}
                </h3>

                {errorMsg && (
                  <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    {errorMsg}
                  </div>
                )}

                {/* Multiple choice options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
                  {(currentQ.options || []).map((opt, optIdx) => {
                    const isSelected = userAnswers[currentQIndex] === optIdx;
                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        style={{
                          padding: '1.1rem 1.4rem',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid #cbd5e1',
                          background: isSelected ? 'rgba(143, 175, 143, 0.12)' : '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: isSelected ? '7px solid var(--color-primary)' : '2px solid #94a3b8',
                            boxSizing: 'border-box'
                          }}
                        />
                        <span style={{ fontSize: '1.05rem', color: '#1e293b', fontWeight: isSelected ? 700 : 500 }}>
                          {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.95rem' }}
                    >
                      <ArrowLeft size={18} /> Vorige
                    </button>
                  ) : <div />}

                  <button
                    type="button"
                    className="btn"
                    onClick={handleNextOrSubmit}
                    disabled={isSubmitting}
                    style={{ padding: '0.8rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {isSubmitting ? 'Bezig met verzenden...' : step === questions.length ? (
                      <>Deelname Bevestigen <Check size={18} /></>
                    ) : (
                      <>Volgende Vraag <ArrowRight size={18} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 999: SUCCESS / RESULT SCREEN */}
            {step === 999 && resultScore && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '1rem 0' }}
              >
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: resultScore.isAllCorrect ? '#10b981' : 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    color: '#fff',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                  }}
                >
                  <Sparkles size={36} />
                </div>

                <h2 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '0.5rem', fontWeight: 800 }}>
                  Bedankt voor je deelname, {participant.name}!
                </h2>

                {resultScore.isSignup ? (
                  <>
                    <div
                      style={{
                        display: 'inline-block',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#065f46',
                        border: '1px solid #10b981',
                        padding: '0.6rem 1.4rem',
                        borderRadius: '30px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        margin: '1rem 0 1.5rem'
                      }}
                    >
                      🎉 Je bent succesvol ingeschreven!
                    </div>
                    <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: '1.8', maxWidth: '520px', margin: '0 auto 2rem' }}>
                      We hebben jouw gegevens goed ontvangen in het systeem. Lindsay kijkt ernaar uit je te verwelkomen bij de challenge!
                    </p>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        display: 'inline-block',
                        background: resultScore.isAllCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: resultScore.isAllCorrect ? '#065f46' : '#92400e',
                        border: resultScore.isAllCorrect ? '1px solid #10b981' : '1px solid #f59e0b',
                        padding: '0.6rem 1.4rem',
                        borderRadius: '30px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        margin: '1rem 0 1.5rem'
                      }}
                    >
                      {resultScore.isAllCorrect ? (
                        <>🎉 Geweldig! Alle {resultScore.totalQuestions} vragen juist beantwoord!</>
                      ) : (
                        <>Je had {resultScore.correctCount} van de {resultScore.totalQuestions} vragen juist!</>
                      )}
                    </div>

                    <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: '1.8', maxWidth: '520px', margin: '0 auto 2rem' }}>
                      {resultScore.isAllCorrect ? (
                        <>Jouw antwoorden zijn gecontroleerd en goedgekeurd. Je bent officieel toegevoegd aan de live winnaarsloting!</>
                      ) : (
                        <>Fijn dat je hebt meegedaan aan de challenge. Lindsay neemt binnenkort contact op of deelt de uitslag!</>
                      )}
                    </p>
                  </>
                )}

                <button onClick={close} className="btn" style={{ padding: '0.8rem 2.5rem', fontSize: '1rem' }}>
                  Sluiten
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        )}

      </div>
    </div>
  );
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(5px)',
  zIndex: 99999,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '1.5rem'
};

const modalContainerStyle = {
  background: '#ffffff',
  padding: '2.5rem',
  borderRadius: '20px',
  width: '100%',
  maxWidth: '620px',
  maxHeight: '90vh',
  overflowY: 'auto',
  position: 'relative',
  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
  color: 'var(--color-text)',
  fontFamily: "'Inter', sans-serif"
};

const closeBtnStyle = {
  position: 'absolute',
  top: '1.2rem',
  right: '1.2rem',
  background: 'none',
  border: 'none',
  color: '#64748b',
  cursor: 'pointer',
  padding: '0.4rem',
  borderRadius: '50%'
};

const formInputStyle = {
  width: '100%',
  padding: '1rem 1.2rem',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  fontSize: '1rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s'
};
