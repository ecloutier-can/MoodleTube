import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Youtube, 
  Settings, 
  Download, 
  Plus, 
  Trash2, 
  PlayCircle, 
  CheckCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Info,
  ChevronRight,
  MessageSquare,
  ListChecks,
  Circle
} from 'lucide-react';
import { extractVideoId } from './core/youtube';
import { bundleScorm } from './core/bundler';

const App = () => {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState(null);
  const [title, setTitle] = useState('Mon Activité YouTube');
  const [itemTitle, setItemTitle] = useState('Regarder la vidéo');
  const [strictMode, setStrictMode] = useState(true);
  const [saveProgress, setSaveProgress] = useState(true);
  const [freeAccess, setFreeAccess] = useState(true);
  const [completionThreshold, setCompletionThreshold] = useState(100);
  const [interactions, setInteractions] = useState([]);
  const [interactionTime, setInteractionTime] = useState('');
  const [interactionMsg, setInteractionMsg] = useState('');
  const [interactionType, setInteractionType] = useState('text');
  const [quizOptions, setQuizOptions] = useState(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const id = extractVideoId(url);
    setVideoId(id);
  }, [url]);

  const addInteraction = () => {
    if (!interactionTime || !interactionMsg) return;
    const timeInSeconds = parseTimeToSeconds(interactionTime);
    
    const newInteraction = { 
      time: timeInSeconds, 
      rawTime: interactionTime, 
      message: interactionMsg,
      type: interactionType
    };

    if (interactionType === 'quiz') {
      newInteraction.options = quizOptions.filter(opt => opt.trim() !== '');
      newInteraction.correct = correctAnswer;
    }

    setInteractions([...interactions, newInteraction]);
    setInteractionTime('');
    setInteractionMsg('');
    setQuizOptions(['', '']);
    setCorrectAnswer(0);
  };

  const updateQuizOption = (index, value) => {
    const newOptions = [...quizOptions];
    newOptions[index] = value;
    setQuizOptions(newOptions);
  };

  const addQuizOption = () => {
    if (quizOptions.length < 4) {
      setQuizOptions([...quizOptions, '']);
    }
  };

  const removeInteraction = (index) => {
    setInteractions(interactions.filter((_, i) => i !== index));
  };

  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr.includes(':')) return parseInt(timeStr) || 0;
    const parts = timeStr.split(':').reverse();
    let seconds = 0;
    for (let i = 0; i < parts.length; i++) {
        seconds += parseInt(parts[i]) * Math.pow(60, i);
    }
    return seconds;
  };

  const handleGenerate = async () => {
    if (!videoId) return alert('Veuillez entrer une URL YouTube valide.');
    try {
      await bundleScorm({
        videoId,
        title,
        itemTitle,
        strictMode,
        saveProgress,
        freeAccess,
        completionThreshold,
        interactions
      });
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du paquetage.');
    }
  };

  return (
    <div className="app-container">
      <div className="help-section">
        <button className="help-btn" onClick={() => setShowHelp(!showHelp)}>
          <Info size={24} />
        </button>
        <AnimatePresence>
          {showHelp && (
            <motion.div 
              className="help-modal"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
            >
              <h3>Guide d'utilisation</h3>
              <ul>
                <li><strong>URL YouTube :</strong> Collez le lien de votre vidéo pour commencer.</li>
                <li><strong>Strict Mode :</strong> Empêche l'étudiant d'avancer manuellement dans la vidéo.</li>
                <li><strong>Suspend Data :</strong> Permet de reprendre là où l'étudiant s'est arrêté.</li>
                <li><strong>Interactions :</strong> Ajoutez des pauses obligatoires avec des messages personnalisés.</li>
                <li><strong>Générer :</strong> Obtenez un .zip prêt à être déposé dans Moodle.</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <header>
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="logo-container"
        >
          <Youtube size={64} color="var(--yt-red)" />
          <h1>Moodle<span className="accent-text">Tube</span></h1>
        </motion.div>
        <p className="subtitle">Générateur de lecteurs SCORM interactifs pour Moodle Studio.</p>
      </header>

      <main className="grid-layout">
        {/* Left Column: Configuration */}
        <section className="config-panel">
          <motion.div 
            className="glass-card"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className="section-header">
              <ExternalLink size={20} className="accent-text" />
              <h2>Vidéo & Titre</h2>
            </div>
            
            <label>URL de la vidéo YouTube</label>
            <input 
              type="text" 
              placeholder="https://www.youtube.com/watch?v=..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            {videoId && <p className="success-text">ID Détecté: {videoId}</p>}

            <label>Titre de l'activité (Moodle)</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="section-header mt-2">
              <Settings size={20} className="accent-text" />
              <h2>Logic & Contrôles</h2>
            </div>
            
            <div className="toggles-grid">
              <Toggle 
                label="Forcer le visionnage (sans avance rapide)" 
                checked={strictMode} 
                onChange={setStrictMode} 
                icon={<ShieldAlert size={18} />}
              />
              <Toggle 
                label="Mémoriser la progression (Suspend Data)" 
                checked={saveProgress} 
                onChange={setSaveProgress} 
                icon={<Clock size={18} />}
              />
              <Toggle 
                label="Libérer la navigation une fois terminée" 
                checked={freeAccess} 
                onChange={setFreeAccess} 
                icon={<CheckCircle size={18} />}
              />
            </div>

            <div className="threshold-container">
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <label>Seuil de réussite</label>
                <span className="accent-text" style={{fontWeight:'bold'}}>{completionThreshold}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={completionThreshold}
                onChange={(e) => setCompletionThreshold(e.target.value)}
                className="yt-range"
              />
            </div>
          </motion.div>

          <motion.div 
            className="glass-card mt-2"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="section-header">
              <PlayCircle size={20} className="accent-text" />
              <h2>Interactions Temporelles</h2>
            </div>

            <div className="type-selector">
              <button 
                className={`type-btn ${interactionType === 'text' ? 'active' : ''}`}
                onClick={() => setInteractionType('text')}
              >
                <MessageSquare size={16} /> Message
              </button>
              <button 
                className={`type-btn ${interactionType === 'quiz' ? 'active' : ''}`}
                onClick={() => setInteractionType('quiz')}
              >
                <ListChecks size={16} /> Question QCM
              </button>
            </div>

            <div className="interaction-inputs">
              <div className="input-row">
                <input 
                  type="text" 
                  placeholder="02:30" 
                  className="time-input"
                  value={interactionTime}
                  onChange={(e) => setInteractionTime(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder={interactionType === 'text' ? "Message à afficher..." : "Votre question..."} 
                  value={interactionMsg}
                  onChange={(e) => setInteractionMsg(e.target.value)}
                  className="flex-1"
                />
              </div>

              {interactionType === 'quiz' && (
                <motion.div 
                  className="quiz-options-editor"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label>Options de réponse (Cochez la bonne)</label>
                  {quizOptions.map((opt, idx) => (
                    <div key={idx} className="option-input-group">
                      <input 
                        type="radio" 
                        name="correct-ans" 
                        checked={correctAnswer === idx}
                        onChange={() => setCorrectAnswer(idx)}
                      />
                      <input 
                        type="text" 
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => updateQuizOption(idx, e.target.value)}
                      />
                    </div>
                  ))}
                  {quizOptions.length < 4 && (
                    <button className="btn-small-add" onClick={addQuizOption}>
                      + Ajouter une option
                    </button>
                  )}
                </motion.div>
              )}

              <button className="btn-add-full" onClick={addInteraction}>
                <Plus size={20} /> Ajouter l'interaction
              </button>
            </div>

            <div className="interaction-list">
              <AnimatePresence>
                {interactions.length > 0 ? (
                  interactions.map((item, idx) => (
                    <motion.div 
                      key={idx}
                      className={`interaction-item ${item.type === 'quiz' ? 'is-quiz' : ''}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <div className="item-main">
                        <span className="badge">{item.rawTime}</span>
                        <span className="type-badge">
                          {item.type === 'quiz' ? <ListChecks size={12} /> : <MessageSquare size={12} />}
                        </span>
                        <span className="msg">{item.message}</span>
                      </div>
                      <button className="btn-trash" onClick={() => removeInteraction(idx)}>
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <p style={{opacity:0.3, textAlign:'center', fontSize:'0.9rem'}}>Aucune interaction ajoutée.</p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {/* Right Column: Preview */}
        <section className="preview-panel">
          <motion.div 
            className="glass-card"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            style={{height: '100%', display: 'flex', flexDirection: 'column'}}
          >
            <div className="section-header">
              <PlayCircle size={20} className="accent-text" />
              <h2>Rendu final</h2>
            </div>
            <div className="preview-video">
              {videoId ? (
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${videoId}`} 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="empty-preview">
                  <Youtube size={80} opacity={0.1} />
                  <p>Entrez une URL pour prévisualiser</p>
                </div>
              )}
            </div>

            <div className="generate-footer">
              <button 
                className="btn-download" 
                disabled={!videoId}
                onClick={handleGenerate}
              >
                <Download size={28} />
                <span>Générer le SCORM (.zip)</span>
              </button>
              <p className="disclaimer">Compatible SCORM 1.2 • Sécurisé pour Moodle • Client-side generation</p>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
};

const Toggle = ({ label, checked, onChange, icon }) => (
  <div className="toggle-item" onClick={() => onChange(!checked)}>
    <div className={`toggle-switch ${checked ? 'active' : ''}`}>
      <div className="toggle-knob"></div>
    </div>
    <span className="toggle-icon">{icon}</span>
    <span className="toggle-label">{label}</span>
  </div>
);

export default App;
