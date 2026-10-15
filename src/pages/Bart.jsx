import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';


// Deney konfigürasyonunu oluştur (10 Mavi, 10 Sarı, 10 Turuncu)
const generateTrials = () => {
  const trialConfig = [
    ...Array(10).fill({ color: '#3b82f6', maxPumps: 128, type: 'Blue' }),
    ...Array(10).fill({ color: '#f59e0b', maxPumps: 32, type: 'Yellow' }),
    ...Array(10).fill({ color: '#f97316', maxPumps: 8, type: 'Orange' })
  ];
  // Durstenfeld shuffle algoritması ile karıştır
  for (let i = trialConfig.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trialConfig[i], trialConfig[j]] = [trialConfig[j], trialConfig[i]];
  }
  return trialConfig;
};

export default function Bart() {
  const navigate = useNavigate();
  const { addBartTrialData, updateParticipant } = useAppContext();
  
  // Ref to hold trials (we only generate once when component mounts)
  const trialsRef = useRef(generateTrials());
  const trials = trialsRef.current;
  
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [pumpCount, setPumpCount] = useState(0);
  const [totalBank, setTotalBank] = useState(0);
  const [popped, setPopped] = useState(false);
  
  // Tepki süreleri için ref'ler
  const lastInteractionTimeUserRef = useRef(Date.now());
  const reactionTimesRef = useRef([]);

  // BART başlangıç zamanını kaydet
  useEffect(() => {
    updateParticipant({ bart_started_at: new Date().toISOString() });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentTrial = trials[currentTrialIndex];
  // Güvenlik: Test bittiyse (currentTrial yoksa) null render
  if (!currentTrial) return null;

  // Yeni trial başlarken timeri sıfırla
  useEffect(() => {
    if (!popped) {
      lastInteractionTimeUserRef.current = Date.now();
      reactionTimesRef.current = [];
    }
  }, [currentTrialIndex, popped]);

  const handleNextTrial = (reward) => {
    // Veriyi kaydet
    const decisionTime = Date.now() - lastInteractionTimeUserRef.current;
    
    addBartTrialData({
      trial_number: currentTrialIndex + 1,
      balloon_type: currentTrial.type,
      max_possible_pumps: currentTrial.maxPumps,
      number_of_pumps: pumpCount,
      popped: popped,
      reward_collected: reward,
      pump_reaction_times_ms: reactionTimesRef.current,
      decision_time_to_collect_ms: popped ? null : decisionTime
    });

    if (currentTrialIndex < trials.length - 1) {
      setCurrentTrialIndex(prev => prev + 1);
      setPumpCount(0);
      setPopped(false);
    } else {
      // Test bitti — bitiş zamanını kaydet, sorulara geç
      updateParticipant({ bart_finished_at: new Date().toISOString() });
      navigate('/questions');
    }
  };


  const handlePump = () => {
    if (popped) return;

    // Reaction time kaydet
    const now = Date.now();
    const rt = now - lastInteractionTimeUserRef.current;
    reactionTimesRef.current.push(rt);
    lastInteractionTimeUserRef.current = now;

    // Patlama algoritması (Olasılık: 1 / (Max - Mevcut Şişirme))
    // Örnek: Max 32. İlk pompada (1/32). Eğer patlamazsa currentPump=1 olur, sonraki (1/31)...
    const probabilityOfPopping = 1 / (currentTrial.maxPumps - pumpCount);
    
    if (Math.random() < probabilityOfPopping || pumpCount + 1 >= currentTrial.maxPumps) {
      // Patladı
      setPopped(true);
      // Kısa bir bekleme (Animasyon görülsün diye) 
      setTimeout(() => {
        handleNextTrial(0);
      }, 1500);
    } else {
      // Şişti
      setPumpCount(prev => prev + 1);
    }
  };

  const handleCollect = () => {
    if (popped || pumpCount === 0) return;
    const reward = pumpCount; // 1 pump = 1 puan
    setTotalBank(prev => prev + reward);
    handleNextTrial(reward);
  };

  // Balonun css scale değeri. 
  // Base scale = 1, her basışta biraz daha büyümesini sağlar.
  // Çarpanı max limite göre ayarlıyoruz ki Mavi(128 max) devasa ekrana sığmamazlık yapmasın.
  const scaleMultiplier = Math.max(0.015, Math.min(0.1, 1.5 / currentTrial.maxPumps)); 
  const balloonScale = 1 + (pumpCount * scaleMultiplier);

  return (
    <div className="page-wrapper">
      
      {/* İstatistikler */}
      <div className="stats-board">
        <div className="stat-box">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Balon</div>
          <div className="stat-value">{currentTrialIndex + 1} / {trials.length}</div>
        </div>
        <div className="stat-box">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bu Eldeki Ödül</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{pumpCount} $</div>
        </div>
        <div className="stat-box" style={{ borderLeft: '2px dashed var(--border)', paddingLeft: '1rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Toplam Kasa</div>
          <div className="stat-value">{totalBank} $</div>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        
        {/* Balon Çizimi / Görselleştirme */}
        <div className="balloon-container">
          {popped ? (
            <div className="popped-feedback">💥 PATLADI! 💥</div>
          ) : (
             <div 
               className="balloon"
               style={{ 
                 width: '80px', 
                 height: '100px', 
                 transform: `scale(${balloonScale})`,
                 backgroundColor: currentTrial.color,
                 // Animasyonlar CSS class'ında (transition).
               }}
             />
          )}
        </div>

        {/* Kontroller */}
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
        
      </div>
    </div>
  );
}
