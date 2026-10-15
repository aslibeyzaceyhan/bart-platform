import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function Demographics() {
  const navigate = useNavigate();
  const { updateParticipant } = useAppContext();
  
  const [formData, setFormData] = useState({
    age: '',
    gender: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.age && formData.gender) {
      updateParticipant({
        ...formData,
        started_at: new Date().toISOString()
      });
      navigate('/instructions');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2>Katılımcı Bilgileri</h2>
        <p>Deneye başlamadan önce lütfen aşağıdaki bilgileri doldurun. Girdiğiniz veriler anonim olarak bilimsel araştırma amacıyla kullanılacaktır.</p>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="age">Yaşınız</label>
            <input 
              type="number" 
              id="age"
              name="age" 
              className="form-input" 
              value={formData.age} 
              onChange={handleChange} 
              min="18" 
              max="100" 
              required 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="gender">Cinsiyetiniz</label>
            <select 
              id="gender"
              name="gender" 
              className="form-input" 
              value={formData.gender} 
              onChange={handleChange} 
              required
            >
              <option value="">Seçiniz</option>
              <option value="male">Erkek</option>
              <option value="female">Kadın</option>
              <option value="other">Belirtmek İstemiyorum / Diğer</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Devam Et
          </button>
        </form>
      </div>
    </div>
  );
}
