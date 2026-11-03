import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

// Lejuez et al. (2002) standardı:
// Adjusted BART skoru = sadece PATLAMAYAN balonlardaki pump sayısının ortalaması.
// Patlayan balonlar hariç tutulur çünkü katılımcının iradesiyle sonuçlanmamıştır.
// Balon tipine göre ayrı ayrı da hesaplanır (Blue/Yellow/Orange).
const calcAdjustedBart = (trials) => {
  const nonPopped = trials.filter((t) => !t.popped);
  if (nonPopped.length === 0) return { overall: null, by_type: {} };

  const overall = Number(
    (nonPopped.reduce((acc, t) => acc + t.number_of_pumps, 0) / nonPopped.length).toFixed(2)
  );

  // Tip bazlı adjusted skor
  const byType = {};
  ['Blue', 'Yellow', 'Orange'].forEach((type) => {
    const typedTrials = nonPopped.filter((t) => t.balloon_type === type);
    byType[type] =
      typedTrials.length > 0
        ? Number(
            (typedTrials.reduce((acc, t) => acc + t.number_of_pumps, 0) / typedTrials.length).toFixed(2)
          )
        : null;
  });

  return { overall, by_type: byType };
};

// Reaction time istatistikleri: her trial'daki pump RT'lerini özetler
const calcRtStats = (trials) => {
  const allRts = trials.flatMap((t) => t.pump_reaction_times_ms ?? []);
  if (allRts.length === 0) return { rt_mean: null, rt_std: null, rt_min: null, rt_max: null };

  const mean = allRts.reduce((a, b) => a + b, 0) / allRts.length;
  const std = Math.sqrt(allRts.reduce((acc, v) => acc + (v - mean) ** 2, 0) / allRts.length);

  return {
    rt_mean: Number(mean.toFixed(1)),
    rt_std: Number(std.toFixed(1)),
    rt_min: Math.min(...allRts),
    rt_max: Math.max(...allRts),
  };
};

export default function Finished() {
  const navigate = useNavigate();
  const { participant, bartResults, questionnaireAnswers, clearSession } = useAppContext();
  const [downloadedFormat, setDownloadedFormat] = useState({ json: false, csv: false });
  const [cloudStatus, setCloudStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
  const [assignedId, setAssignedId] = useState(null);
  const hasSentRef = useRef(false);

  const adjustedBart = calcAdjustedBart(bartResults);
  const rtStats = calcRtStats(bartResults);
  const totalScore = bartResults.reduce((acc, curr) => acc + curr.reward_collected, 0);
  const poppedCount = bartResults.filter((t) => t.popped).length;

  // Faz süreleri (ms)
  const bartDurationMs =
    participant.bart_started_at && participant.bart_finished_at
      ? new Date(participant.bart_finished_at) - new Date(participant.bart_started_at)
      : null;
  const dospertDurationMs =
    participant.dospert_started_at && participant.dospert_finished_at
      ? new Date(participant.dospert_finished_at) - new Date(participant.dospert_started_at)
      : null;

  // Attention check sonucu
  const attentionCheckAnswer = questionnaireAnswers.find((a) => a.is_attention_check);
  const attentionCheckPassed = attentionCheckAnswer?.attention_check_passed ?? null;

  // DOSPERT ortalamasını attention check sorusu hariç hesapla
  const dospertAnswers = questionnaireAnswers.filter((a) => !a.is_attention_check);
  const nonMoneyRiskScore =
    dospertAnswers.length > 0
      ? dospertAnswers.reduce((acc, curr) => acc + curr.answer_score, 0) / dospertAnswers.length
      : null;

  const domainScoreAccumulator = dospertAnswers.reduce((acc, curr) => {
    if (!acc[curr.domain]) acc[curr.domain] = { total: 0, count: 0 };
    acc[curr.domain].total += curr.answer_score;
    acc[curr.domain].count += 1;
    return acc;
  }, {});

  const nonMoneyRiskDomainScores = Object.fromEntries(
    Object.entries(domainScoreAccumulator).map(([domain, value]) => [
      domain,
      Number((value.total / value.count).toFixed(2)),
    ])
  );

  // --- Ortak CSV Üretici Fonksiyon ---
  const generateCsvContent = useCallback((currentSubject = assignedId || 'p1') => {
    const headers = [
      'trial',
      'reward',
      'explosion',
      'pumps',
      'onset',
      'duration',
      'subject',
      'balloon_type',
      'max_possible_pumps',
      'rt_mean_ms',
      'decision_time_ms',
      'age',
      'gender',
      'bart_total_score',
      'bart_adjusted_score',
      'dospert_mean_score',
      'dospert_social',
      'dospert_recreational',
      'dospert_health_safety',
      'dospert_ethical',
      'attention_check_passed',
    ];

    let cumulativeOnsetSec = 0.0;

    const rows = bartResults.map((t) => {
      const rts = t.pump_reaction_times_ms || [];
      const rtSum = rts.reduce((a, b) => a + b, 0);
      const decisionMs = t.decision_time_to_collect_ms ?? (t.popped ? 1500 : 0);
      const durationSec = Number(((rtSum + decisionMs) / 1000).toFixed(3));
      const currentOnset = Number(cumulativeOnsetSec.toFixed(3));
      cumulativeOnsetSec += durationSec;

      const rtMean =
        rts.length > 0 ? (rts.reduce((a, b) => a + b, 0) / rts.length).toFixed(1) : '';

      return [
        t.trial_number,
        t.reward_collected,
        t.popped ? 1 : 0,
        t.number_of_pumps,
        currentOnset,
        durationSec,
        currentSubject,
        t.balloon_type,
        t.max_possible_pumps,
        rtMean,
        t.decision_time_to_collect_ms ?? '',
        participant.age || '',
        participant.gender || '',
        totalScore,
        adjustedBart.overall ?? '',
        nonMoneyRiskScore !== null ? Number(nonMoneyRiskScore.toFixed(2)) : '',
        nonMoneyRiskDomainScores.social ?? '',
        nonMoneyRiskDomainScores.recreational ?? '',
        nonMoneyRiskDomainScores.health_safety ?? '',
        nonMoneyRiskDomainScores.ethical ?? '',
        attentionCheckPassed !== null ? (attentionCheckPassed ? 1 : 0) : '',
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }, [assignedId, bartResults, participant, totalScore, adjustedBart, nonMoneyRiskScore, nonMoneyRiskDomainScores, attentionCheckPassed]);

  // --- Otomatik SheetDB Google E-Tablo Bulut Gönderimi (1 Katılımcı = 1 Satır & p1, p2, p3...) ---
  useEffect(() => {
    let isMounted = true;

    async function initSubmission() {
      if (hasSentRef.current || !participant.id || bartResults.length === 0) return;
      hasSentRef.current = true;
      setCloudStatus('sending');

      let currentSubject = 'p1';
      try {
        const countRes = await fetch('https://sheetdb.io/api/v1/dmc35v1366pgx/count');
        if (countRes.ok) {
          const countData = await countRes.json();
          const rowsCount = typeof countData.rows === 'number' ? countData.rows : 0;
          currentSubject = `p${rowsCount + 1}`;
        }
      } catch (err) {
        console.warn('SheetDB count fetch fallback:', err);
      }

      if (isMounted) {
        setAssignedId(currentSubject);
      }

      const submittedAt = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

      // 30 denemenin kompakt JSON özeti (Perspektif C / LSTM veya zaman serisi analizi için)
      const compactTrials = bartResults.map((t) => ({
        trial: t.trial_number,
        balloon: t.balloon_type,
        max_pumps: t.max_possible_pumps,
        pumps: t.number_of_pumps,
        popped: t.popped ? 1 : 0,
        reward: t.reward_collected,
        rts: t.pump_reaction_times_ms,
        decision_ms: t.decision_time_to_collect_ms,
      }));

      const payloadRow = {
        subject: currentSubject,
        submitted_at: submittedAt,
        age: participant.age || '',
        gender: participant.gender || '',
        attention_check: attentionCheckPassed ? 'Gecti' : 'Kaldi',
        total_score: totalScore,
        bart_total_score: totalScore,
        popped_count: poppedCount,
        bart_popped_count: poppedCount,
        adjusted_bart: adjustedBart.overall ?? '',
        bart_adjusted_score: adjustedBart.overall ?? '',
        adjusted_blue: adjustedBart.by_type?.Blue ?? '',
        adjusted_yellow: adjustedBart.by_type?.Yellow ?? '',
        adjusted_orange: adjustedBart.by_type?.Orange ?? '',
        rt_mean_ms: rtStats.rt_mean ?? '',
        rt_std_ms: rtStats.rt_std ?? '',
        dospert_mean_score: nonMoneyRiskScore !== null ? Number(nonMoneyRiskScore.toFixed(2)) : '',
        dospert_social: nonMoneyRiskDomainScores.social ?? '',
        dospert_recreational: nonMoneyRiskDomainScores.recreational ?? '',
        dospert_health_safety: nonMoneyRiskDomainScores.health_safety ?? '',
        dospert_ethical: nonMoneyRiskDomainScores.ethical ?? '',
        bart_duration_sec: bartDurationMs ? (bartDurationMs / 1000).toFixed(1) : '',
        dospert_duration_sec: dospertDurationMs ? (dospertDurationMs / 1000).toFixed(1) : '',
        trials_data: JSON.stringify(compactTrials),
      };

      try {
        const res = await fetch('https://sheetdb.io/api/v1/dmc35v1366pgx', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ data: [payloadRow] }),
        });

        if (isMounted) {
          if (res.ok) {
            setCloudStatus('success');
          } else {
            setCloudStatus('error');
          }
        }
      } catch {
        if (isMounted) setCloudStatus('error');
      }
    }

    initSubmission();
    return () => {
      isMounted = false;
    };
  }, [participant, bartResults, totalScore, poppedCount, adjustedBart, rtStats, nonMoneyRiskScore, nonMoneyRiskDomainScores, attentionCheckPassed, bartDurationMs, dospertDurationMs]);

  // --- JSON İndirme ---
  const handleDownloadJSON = () => {
    const currentSubject = assignedId || 'p1';
    const dataToExport = {
      participant_id: currentSubject,
      age: participant.age,
      gender: participant.gender,
      started_at: participant.started_at,
      finished_at: new Date().toISOString(),

      attention_check_passed: attentionCheckPassed,
      bart_duration_ms: bartDurationMs,
      dospert_duration_ms: dospertDurationMs,

      bart_total_score: totalScore,
      bart_popped_count: poppedCount,
      bart_adjusted_score: adjustedBart.overall,
      bart_adjusted_score_by_type: adjustedBart.by_type,

      bart_rt_mean_ms: rtStats.rt_mean,
      bart_rt_std_ms: rtStats.rt_std,
      bart_rt_min_ms: rtStats.rt_min,
      bart_rt_max_ms: rtStats.rt_max,

      dospert_mean_score:
        nonMoneyRiskScore !== null ? Number(nonMoneyRiskScore.toFixed(2)) : null,
      dospert_domain_scores: nonMoneyRiskDomainScores,
      questionnaire_source: 'DOSPERT RT scale, financial items excluded (Blais & Weber, 2006)',
      questionnaire_answers: questionnaireAnswers,

      trials: bartResults,
    };

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `bart_data_participant_${currentSubject}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();

    setDownloadedFormat((prev) => ({ ...prev, json: true }));
  };

  // --- CSV İndirme (Açık BART fMRI veri seti ve MATLAB/Python ANN modelleriyle %100 uyumlu) ---
  const handleDownloadCSV = () => {
    const currentSubject = assignedId || 'p1';
    const csvContent = generateCsvContent(currentSubject);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `subject-${currentSubject}_task-bart.csv`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setDownloadedFormat((prev) => ({ ...prev, csv: true }));
  };

  const handleNewParticipant = () => {
    clearSession();
    navigate('/consent');
  };

  return (
    <div className="page-wrapper">
      <div className="card" style={{ textAlign: 'center', maxWidth: '580px', width: '100%' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ marginBottom: '0.5rem' }}>Deney Tamamlandı!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Katılımınız için teşekkür ederiz.
        </p>

        {/* Bulut Kayıt Durum Bildirimi */}
        {cloudStatus === 'sending' && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#60a5fa',
              marginBottom: '1.25rem',
              fontSize: '0.9rem',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            ☁️ Verileriniz buluta otomatik kaydediliyor...
          </div>
        )}
        {cloudStatus === 'success' && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#4ade80',
              marginBottom: '1.25rem',
              fontSize: '0.9rem',
              fontWeight: 500,
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            ✅ Verileriniz buluta başarıyla kaydedildi! Katılımınız tamamlanmıştır.
          </div>
        )}
        {cloudStatus === 'error' && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            ⚠️ Otomatik kayıt sırasında bir gecikme oldu. Lütfen aşağıdaki butondan CSV dosyanızı indiriniz.
          </div>
        )}

        {assignedId && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
            Katılımcı Kodu: <strong style={{ color: 'var(--primary, #3b82f6)', fontSize: '1.05rem' }}>{assignedId}</strong>
          </div>
        )}

        <div className="stats-board" style={{ marginBottom: '0.75rem' }}>
          <div className="stat-box">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Toplam Puan</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{totalScore} $</div>
          </div>
          <div className="stat-box">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Adjusted BART</div>
            <div className="stat-value">
              {adjustedBart.overall !== null ? adjustedBart.overall : '—'}
            </div>
          </div>
          <div className="stat-box">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Patlayan</div>
            <div className="stat-value">{poppedCount} / {bartResults.length}</div>
          </div>
          {nonMoneyRiskScore !== null && (
            <div className="stat-box">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>DOSPERT Ort.</div>
              <div className="stat-value">{nonMoneyRiskScore.toFixed(2)} / 7</div>
            </div>
          )}
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          Adjusted BART = patlamayan balonlardaki ortalama pump sayısı (Lejuez et al., 2002)
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadCSV}
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 600 }}
          >
            📊 CSV Dosyasını İndir (Yedek) {downloadedFormat.csv && '✓'}
          </button>

          <button
            type="button"
            className="btn"
            onClick={handleDownloadJSON}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.9rem',
              background: 'var(--surface-variant, #2a2d37)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            📦 Ham JSON İndir {downloadedFormat.json && '✓'}
          </button>
        </div>

        <button
          type="button"
          onClick={handleNewParticipant}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            textDecoration: 'underline',
          }}
        >
          🔄 Yeni Katılımcı Başlat
        </button>
      </div>
    </div>
  );
}
