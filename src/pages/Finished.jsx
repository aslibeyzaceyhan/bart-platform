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
  const { participant, bartResults, questionnaireAnswers, clearSession } = useAppContext();

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

  const handleDownload = () => {
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

    const dataToExport = {
      participant_id: participant.id,
      age: participant.age,
      gender: participant.gender,
      started_at: participant.started_at,
      finished_at: new Date().toISOString(),

      // --- Veri Kalitesi ---
      attention_check_passed: attentionCheckPassed,  // false ise katılımcıyı analizden çıkar

      // --- Faz Süreleri ---
      bart_duration_ms: bartDurationMs,
      dospert_duration_ms: dospertDurationMs,

      // --- BART Skorları ---
      bart_total_score: totalScore,
      bart_popped_count: poppedCount,

      // Literatür standardı skor (Lejuez et al., 2002)
      bart_adjusted_score: adjustedBart.overall,
      bart_adjusted_score_by_type: adjustedBart.by_type,

      // Pump reaction time istatistikleri (impulsivite göstergesi)
      bart_rt_mean_ms: rtStats.rt_mean,
      bart_rt_std_ms: rtStats.rt_std,
      bart_rt_min_ms: rtStats.rt_min,
      bart_rt_max_ms: rtStats.rt_max,

      // --- DOSPERT Skorları ---
      dospert_mean_score:
        nonMoneyRiskScore !== null ? Number(nonMoneyRiskScore.toFixed(2)) : null,
      dospert_domain_scores: nonMoneyRiskDomainScores,
      questionnaire_source: 'DOSPERT RT scale, financial items excluded (Blais & Weber, 2006)',
      questionnaire_answers: questionnaireAnswers,

      // --- Ham veri ---
      trials: bartResults,
    };

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `bart_data_participant_${participant.id}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Oturum verisini temizle (bir sonraki katılımcı için)
    clearSession();
  };


  return (
    <div className="page-wrapper">
      <div className="card" style={{ textAlign: 'center', maxWidth: '560px', width: '100%' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ marginBottom: '0.5rem' }}>Deney Tamamlandı!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Katılımınız için teşekkür ederiz.
        </p>

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

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleDownload}
          style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
        >
          📥 Veriyi İndir (JSON)
        </button>
      </div>
    </div>
  );
}
