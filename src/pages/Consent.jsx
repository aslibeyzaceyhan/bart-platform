import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Consent() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="page-wrapper">
      <div className="card" style={{ maxWidth: '680px', width: '100%' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Aydınlatılmış Onam Formu</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Lütfen aşağıdaki bilgileri dikkatlice okuyun.
        </p>

        <div style={{ lineHeight: '1.75', fontSize: '0.97rem' }}>

          <h3 style={{ marginBottom: '0.5rem' }}>Araştırmanın Amacı</h3>
          <p style={{ marginBottom: '1.25rem' }}>
            Bu çalışma, bireylerin risk alma davranışlarını bilgisayar tabanlı bir görev (Balon Analoji Risk Testi – BART)
            ve bir anket aracılığıyla ölçmeyi amaçlamaktadır. Elde edilen veriler, yapay zeka yöntemleriyle
            risk alma profillerinin sınıflandırılması üzerine yürütülen bir bitirme tezi kapsamında kullanılacaktır.
          </p>

          <h3 style={{ marginBottom: '0.5rem' }}>Gönüllülük ve Gizlilik</h3>
          <p style={{ marginBottom: '1.25rem' }}>
            Katılımınız tamamen <strong>gönüllülük</strong> esasına dayanmaktadır; istediğiniz zaman
            çalışmadan çekilebilirsiniz. Toplanan tüm veriler <strong>anonim</strong> olarak işlenmekte
            olup kimliğinizi tanımlamaya yönelik hiçbir bilgi kayıt edilmemektedir.
          </p>

          <h3 style={{ marginBottom: '0.5rem' }}>İçerik Hakkında Bilgilendirme</h3>
          <p style={{ marginBottom: '0.5rem' }}>
            Anket bölümü; sosyal, etik, rekreasyonel ve sağlık/güvenlik alanlarında risk alma
            davranışlarına ilişkin sorular içermektedir. Bu sorular arasında <strong>sağlık ve cinsel
            sağlık davranışlarıyla ilgili</strong> ifadeler de yer almaktadır. Tüm sorular uluslararası
            alanda geçerliliği onaylanmış DOSPERT-RT ölçeğinden alınmıştır.
          </p>
          <p style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Herhangi bir soruyu yanıtlamak istememeniz durumunda çalışmayı sonlandırabilirsiniz.
          </p>

          <h3 style={{ marginBottom: '0.5rem' }}>Katılımcı Kriterleri</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Bu çalışmaya yalnızca <strong>18 yaş ve üzeri</strong> bireyler katılabilir.
          </p>

          <div style={{
            padding: '1rem',
            background: 'var(--background)',
            borderRadius: '8px',
            borderLeft: '4px solid var(--primary)',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            color: 'var(--text-muted)'
          }}>
            Sorularınız için araştırmacıyla iletişime geçebilirsiniz.<br />
            <strong>İstanbul Teknik Üniversitesi — Elektronik ve Haberleşme Mühendisliği Bölümü</strong>
          </div>
        </div>

        {/* Onay checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          lineHeight: '1.5'
        }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ marginTop: '3px', width: '18px', height: '18px', flexShrink: 0, cursor: 'pointer' }}
          />
          <span>
            Yukarıdaki bilgileri okudum, anladım ve <strong>18 yaşında veya daha büyük</strong> olduğumu
            beyan ederek çalışmaya <strong>gönüllü olarak</strong> katılmayı kabul ediyorum.
          </span>
        </label>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/demographics')}
          disabled={!agreed}
          style={{ width: '100%', padding: '1rem', fontSize: '1rem', opacity: !agreed ? 0.5 : 1 }}
        >
          Devam Et
        </button>
      </div>
    </div>
  );
}
