import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

/*
  DOSPERT-based non-monetary risk questionnaire.
  Based on Blais & Weber (2006) DOSPERT RT scale.
  Financial items are excluded because BART already measures monetary/reward-based risk-taking.
*/

const QUESTIONS = [
  {
    id: 1,
    source: 'DOSPERT_RT',
    domain: 'social',
    text: 'Bir arkadaşının zevklerinden farklı zevklere sahip olduğunu açıkça söyleme olasılığın nedir?'
  },
  {
    id: 2,
    source: 'DOSPERT_RT',
    domain: 'recreational',
    text: 'Doğada kamp yapma olasılığın nedir?'
  },
  {
    id: 3,
    source: 'DOSPERT_RT',
    domain: 'health_safety',
    text: 'Sosyal bir ortamda aşırı miktarda alkol alma olasılığın nedir?'
  },
  {
    id: 4,
    source: 'DOSPERT_RT',
    domain: 'ethical',
    text: 'Vergi beyanında tartışmalı/kesin olmayan bazı indirimler kullanma olasılığın nedir?'
  },
  {
    id: 5,
    source: 'DOSPERT_RT',
    domain: 'social',
    text: 'Önemli bir konuda otorite figürüyle fikir ayrılığını açıkça belirtme olasılığın nedir?'
  },
  {
    id: 6,
    source: 'DOSPERT_RT',
    domain: 'ethical',
    text: 'Başkasının çalışmasını kendi çalışman gibi gösterme olasılığın nedir?'
  },
  {
    id: 7,
    source: 'DOSPERT_RT',
    domain: 'recreational',
    text: 'Kendi seviyenin üzerinde zorlukta bir kayak pistinden inme olasılığın nedir?'
  },
  {
    id: 8,
    source: 'DOSPERT_RT',
    domain: 'recreational',
    text: 'Bahar aylarında su seviyesi yüksekken rafting yapma olasılığın nedir?'
  },
  {
    id: 9,
    source: 'DOSPERT_RT',
    domain: 'health_safety',
    text: 'Korunmasız cinsel ilişkiye girme olasılığın nedir?'
  },
  {
    id: 10,
    source: 'DOSPERT_RT',
    domain: 'ethical',
    text: 'Bir arkadaşının sırrını başka birine söyleme olasılığın nedir?'
  },
  {
    id: 11,
    source: 'DOSPERT_RT',
    domain: 'health_safety',
    text: 'Emniyet kemeri takmadan araba kullanma olasılığın nedir?'
  },
  {
    id: 12,
    source: 'DOSPERT_RT',
    domain: 'recreational',
    text: 'Paraşütle atlama dersi alma olasılığın nedir?'
  },
  {
    id: 13,
    source: 'DOSPERT_RT',
    domain: 'health_safety',
    text: 'Kask takmadan motosiklet kullanma olasılığın nedir?'
  },
  {
    id: 14,
    source: 'DOSPERT_RT',
    domain: 'social',
    text: 'Daha güvenli bir kariyer yerine gerçekten keyif aldığın bir kariyeri seçme olasılığın nedir?'
  },
  {
    id: 15,
    source: 'DOSPERT_RT',
    domain: 'social',
    text: 'Bir toplantıda popüler olmayan bir konu hakkında fikrini açıkça söyleme olasılığın nedir?'
  },
  {
    id: 16,
    source: 'DOSPERT_RT',
    domain: 'health_safety',
    text: 'Güneş kremi kullanmadan uzun süre güneşlenme olasılığın nedir?'
  },
  {
    id: 17,
    source: 'DOSPERT_RT',
    domain: 'recreational',
    text: 'Yüksek bir köprüden bungee jumping yapma olasılığın nedir?'
  },
  {
    id: 18,
    source: 'DOSPERT_RT',
    domain: 'recreational',
    text: 'Küçük bir uçağı pilot olarak kullanmayı deneme olasılığın nedir?'
  },
  {
    id: 19,
    source: 'DOSPERT_RT',
    domain: 'health_safety',
    text: 'Güvensiz sayılabilecek bir bölgede gece yalnız eve yürüme olasılığın nedir?'
  },
  {
    id: 20,
    source: 'DOSPERT_RT',
    domain: 'social',
    text: 'Ailenden uzakta başka bir şehre taşınma olasılığın nedir?'
  },
  {
    id: 21,
    source: 'DOSPERT_RT',
    domain: 'social',
    text: 'Otuzlu yaşlarının ortasında yeni bir kariyere başlama olasılığın nedir?'
  },
  {
    id: 22,
    source: 'DOSPERT_RT',
    domain: 'ethical',
    text: 'Kısa bir iş için dışarı çıkarken küçük çocukları evde yalnız bırakma olasılığın nedir?'
  },
  {
    id: 23,
    source: 'DOSPERT_RT',
    domain: 'ethical',
    text: 'İçinde para bulunan bulduğun bir cüzdanı sahibine iade etmeme olasılığın nedir?'
  }
];

const OPTIONS = [
  { value: 1, label: 'Kesinlikle yapmam' },
  { value: 2, label: 'Büyük ihtimalle yapmam' },
  { value: 3, label: 'Muhtemelen yapmam' },
  { value: 4, label: 'Kararsızım' },
  { value: 5, label: 'Muhtemelen yaparım' },
  { value: 6, label: 'Büyük ihtimalle yaparım' },
  { value: 7, label: 'Kesinlikle yaparım' }
];

// 12. sırada dikkat kontrolü sorusu (23 DOSPERT sorusunun tam ortasına yakın)
const ATTENTION_CHECK_QUESTION = {
  id: 'ATTENTION_CHECK',
  source: 'ATTENTION_CHECK',
  domain: 'attention_check',
  isAttentionCheck: true,
  correctAnswer: 4,
  text: 'Bu anketi dikkatli doldurduğunuzu doğrulamak için lütfen "4 - Kararsızım" seçeneğini seçiniz.',
};

// 11. sorudan sonra attention check sokulur (index 11)
const ALL_QUESTIONS = [
  ...QUESTIONS.slice(0, 11),
  ATTENTION_CHECK_QUESTION,
  ...QUESTIONS.slice(11),
];

export default function Questions() {
  const navigate = useNavigate();
  const { setQuestionnaireAnswers, updateParticipant } = useAppContext();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const currentQuestion = ALL_QUESTIONS[currentQuestionIndex];

  // DOSPERT başlangıç zamanı
  useEffect(() => {
    updateParticipant({ dospert_started_at: new Date().toISOString() });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleNext = () => {
    if (!selectedOption) return;

    const reactionTimeMs = Date.now() - questionStartTime;
    const selectedLabel = OPTIONS.find((option) => option.value === selectedOption)?.label;

    const newAnswers = [
      ...answers,
      {
        question_id: currentQuestion.id,
        source: currentQuestion.source,
        domain: currentQuestion.domain,
        question_text: currentQuestion.text,
        answer_score: currentQuestion.isAttentionCheck ? null : selectedOption,
        answer_label: selectedLabel,
        reaction_time_ms: reactionTimeMs,
        timestamp: new Date().toISOString(),
        // Attention check alanları
        is_attention_check: currentQuestion.isAttentionCheck ?? false,
        attention_check_passed: currentQuestion.isAttentionCheck
          ? selectedOption === currentQuestion.correctAnswer
          : null,
      },
    ];

    setAnswers(newAnswers);

    if (currentQuestionIndex < ALL_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      // DOSPERT bitiş zamanını kaydet
      updateParticipant({ dospert_finished_at: new Date().toISOString() });
      setQuestionnaireAnswers(newAnswers);
      navigate('/finished');
    }
  };


  return (
    <div className="page-wrapper">
      <div className="card" style={{ maxWidth: '720px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', color: 'var(--text-light)', fontWeight: '500' }}>
          <span>Soru {currentQuestionIndex + 1} / {ALL_QUESTIONS.length}</span>

          <div style={{ width: '60%', height: '8px', background: 'var(--background)', borderRadius: '4px', overflow: 'hidden', alignSelf: 'center' }}>
            <div
              style={{
                height: '100%',
                background: 'var(--primary)',
                width: `${((currentQuestionIndex + 1) / ALL_QUESTIONS.length) * 100}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
          Aşağıdaki durumda bu davranışı yapma olasılığınızı işaretleyiniz.
        </p>

        <h2 style={{ marginBottom: '2rem', fontSize: '1.35rem', textAlign: 'center', lineHeight: '1.4' }}>
          {currentQuestion.text}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedOption(option.value)}
              style={{
                padding: '1rem 1.25rem',
                fontSize: '1rem',
                borderRadius: 'var(--radius)',
                border: selectedOption === option.value ? '2px solid var(--primary)' : '2px solid var(--border)',
                background: selectedOption === option.value ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                color: selectedOption === option.value ? 'var(--primary)' : 'var(--text)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                fontWeight: selectedOption === option.value ? '600' : '400'
              }}
            >
              <strong style={{ marginRight: '1rem' }}>{option.value}</strong>
              {option.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={!selectedOption}
          className="btn btn-primary"
          style={{ width: '100%', opacity: !selectedOption ? 0.5 : 1 }}
        >
          {currentQuestionIndex === QUESTIONS.length - 1 ? 'Tamamla ve İlerle' : 'Sonraki Soru'}
        </button>
      </div>
    </div>
  );
}