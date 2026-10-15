import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppContext = createContext();

const SESSION_KEYS = {
  participant: 'bart_participant',
  bartResults: 'bart_results',
  questionnaire: 'bart_questionnaire',
};

function loadFromSession(key, fallback) {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [participant, setParticipant] = useState(() =>
    loadFromSession(SESSION_KEYS.participant, {
      id: uuidv4(),
      age: '',
      gender: '',
      started_at: null,
      // Faz zamanlamaları
      bart_started_at: null,
      bart_finished_at: null,
      dospert_started_at: null,
      dospert_finished_at: null,
    })
  );

  const [bartResults, setBartResults] = useState(() =>
    loadFromSession(SESSION_KEYS.bartResults, [])
  );

  const [questionnaireAnswers, setQuestionnaireAnswers] = useState(() =>
    loadFromSession(SESSION_KEYS.questionnaire, [])
  );

  // sessionStorage'a otomatik kaydet
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEYS.participant, JSON.stringify(participant));
  }, [participant]);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEYS.bartResults, JSON.stringify(bartResults));
  }, [bartResults]);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEYS.questionnaire, JSON.stringify(questionnaireAnswers));
  }, [questionnaireAnswers]);

  const updateParticipant = (data) =>
    setParticipant((prev) => ({ ...prev, ...data }));

  const addBartTrialData = (trialData) =>
    setBartResults((prev) => [...prev, trialData]);

  // Deney tamamlandıktan sonra oturumu temizle
  const clearSession = () => {
    Object.values(SESSION_KEYS).forEach((k) => sessionStorage.removeItem(k));
  };

  const value = {
    participant,
    updateParticipant,
    bartResults,
    setBartResults,
    addBartTrialData,
    questionnaireAnswers,
    setQuestionnaireAnswers,
    clearSession,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
