import { useNavigate } from 'react-router-dom';

export default function Instructions() {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2>Deney Talimatları</h2>
        <div style={{ marginTop: '1.5rem', lineHeight: '1.7' }}>
          <p>
            Bu deneyde, ekranda beliren balonları şişirerek ödül puanları kazanacaksınız. 
            Toplam <strong>30 adet</strong> balon ile karşılaşacaksınız (Mavi, Sarı veya Turuncu renklerde).
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
            <li style={{ marginBottom: '0.5rem' }}>Ekranda beliren <strong>Her Şişirme (Pump)</strong> size daha fazla puan kazandırır.</li>
            <li style={{ marginBottom: '0.5rem' }}>Ancak, balon her an <strong>PATLAYABİLİR</strong>. Eğer balon patlarsa, o balondan kazandığınız tüm puanlar sıfırlanır.</li>
            <li style={{ marginBottom: '0.5rem' }}>Riski kendiniz belirlemelisiniz. Balon patlamadan önce <strong>"Kesti (Collect)"</strong> butonuna basarsanız, biriken puanlarınız güvenli kasanıza aktarılır ve sonraki balona geçersiniz.</li>
          </ul>
          
          <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: '8px', borderLeft: '4px solid var(--primary)', marginBottom: '1.5rem' }}>
            <strong>Özetle:</strong> Mümkün olduğunca çok puan toplamaya çalışın, ancak açgözlü davranıp balonun patlamasına izin vermeyin!
          </div>
        </div>

        <button 
          onClick={() => navigate('/practice')} 
          className="btn btn-primary" 
          style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}
        >
          Hazırım, Başla!
        </button>
      </div>
    </div>
  );
}
