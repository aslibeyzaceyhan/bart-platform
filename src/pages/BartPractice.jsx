import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PRACTICE_TRIAL = { color: '#f97316', maxPumps: 8, type: 'Orange' };

export default function BartPractice() {
  const navigate = useNavigate();
  const [pumpCount, setPumpCount] = useState(0);
  const [popped, setPopped] = useState(false);
  const [done, setDone] = useState(false);
  const [collected, setCollected] = useState(null);

  const handlePump = () => {
    if (popped || done) return;
    const prob = 1 / (PRACTICE_TRIAL.maxPumps - pumpCount);
    if (Math.random() < prob || pumpCount + 1 >= PRACTICE_TRIAL.maxPumps) {
      setPopped(true);
      setTimeout(() => setDone(true), 1500);
    } else {
      setPumpCount((prev) => prev + 1);
    }
  };

  const handleCollect = () => {
    if (popped || pumpCount === 0 || done) return;
    setCollected(pumpCount);
    setDone(true);
  };

  const scaleMultiplier = Math.max(0.015, Math.min(0.1, 1.5 / PRACTICE_TRIAL.maxPumps));
  const balloonScale = 1 + pumpCount * scaleMultiplier;

  return (
    <div className="page-wrapper">
      {/* Pratik uyarı bandı */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.12)',
        border: '2px dashed #f59e0b',
        borderRadius: '8px',
        padding: '0.75rem 1.5rem',
        marginBottom: '1.5rem',
        textAlign: 'center',
        color: '#b45309',
        fontWeight: '600',
        fontSize: '0.95rem',
      }}>
        🎯 PRATİK DENEME — Bu veriler kaydedilmeyecektir
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div className="balloon-container">
          {popped ? (
            <div className="popped-feedback">💥 PATLADI! 💥</div>
          ) : !done ? (
            <div
              className="balloon"
              style={{
                width: '80px',
                height: '100px',
                transform: `scale(${balloonScale})`,
                backgroundColor: PRACTICE_TRIAL.color,
              }}
            />
          ) : null}
        </div>

        {!done ? (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Şişir butonuna her bastığında balon büyür ve ödülün artar — ama patlarsa sıfırlanır.
              İstediğinde "Kesti" ile güvende topla.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePump}
                disabled={popped}
                style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}
              >
                Şişir (Pump)
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleCollect}
                disabled={popped || pumpCount === 0}
                style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}
              >
                Kesti (Tahsil Et)
              </button>
            </div>
          </>
        ) : (
          <div>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              {popped
                ? '💥 Balon patladı! Endişelenmeyin, bu sadece pratikti.'
                : `✅ ${collected} puan topladınız! Sistemi anladınız.`}
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
              Gerçek deneyde <strong>30 balon</strong> ile karşılaşacaksınız ve puanlarınız kaydedilecek.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/bart')}
              style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
            >
              Gerçek Deneye Başla →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
