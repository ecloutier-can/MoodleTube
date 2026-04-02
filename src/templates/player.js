/**
 * Generates the HTML content for the SCORM player.
 * @param {object} config - Sanitized configuration object.
 * @returns {string} - The index.html for the SCORM package.
 */
export const generatePlayerHtml = (config) => {
  const { 
    videoId, 
    strictMode, 
    saveProgress, 
    freeAccess, 
    completionThreshold, 
    interactions=[] 
  } = config;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lecteur YouTube Interactif SCORM</title>
  <style>
    body { font-family: 'Outfit', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f0f0f; color: white; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden; }
    .video-container { width: 100%; max-width: 1000px; aspect-ratio: 16 / 9; background: #000; position: relative; box-shadow: 0 40px 100px rgba(0,0,0,0.8); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
    #player { width: 100%; height: 100%; }
    
    #overlay { 
      position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(15,15,15,0.95); display: none; flex-direction: column; 
      align-items: center; justify-content: center; transition: all 0.4s ease; 
      z-index: 1000; -webkit-backdrop-filter: blur(15px); backdrop-filter: blur(15px);
      padding: 2rem; box-sizing: border-box;
    }
    .overlay-content { text-align: center; max-width: 800px; width: 100%; }
    .overlay-message { 
      font-size: 1.8rem; margin-bottom: 2rem; color: #ffffff; font-weight: 800; 
      line-height: 1.3; text-shadow: 0 4px 20px rgba(255,0,51,0.3);
    }
    
    /* Quiz Styles */
    .quiz-options { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; width: 100%; }
    .quiz-option { 
      background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1); 
      color: white; padding: 1.2rem; border-radius: 12px; cursor: pointer; 
      font-size: 1.1rem; font-weight: 600; transition: all 0.2s; text-align: left;
    }
    .quiz-option:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); transform: translateY(-2px); }
    .quiz-option.correct { background: #2ecc71 !important; border-color: #27ae60 !important; color: white; }
    .quiz-option.wrong { background: #e74c3c !important; border-color: #c0392b !important; color: white; }
    
    .feedback { font-size: 1.2rem; font-weight: 700; margin-bottom: 1.5rem; display: none; padding: 1rem; border-radius: 8px; }
    .feedback.success { color: #2ecc71; display: block; }
    .feedback.error { color: #e74c3c; display: block; }

    .btn-continue { 
      background: linear-gradient(135deg, #FF0033 0%, #CC0029 100%); 
      color: white; border: none; padding: 16px 40px; 
      border-radius: 50px; font-size: 1.1rem; cursor: pointer; font-weight: 700;
      box-shadow: 0 10px 30px rgba(255,0,51,0.4);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      text-transform: uppercase; letter-spacing: 1px; display: inline-block;
    }
    .btn-continue:hover { transform: scale(1.05); box-shadow: 0 15px 40px rgba(255,0,51,0.6); }
    
    /* Markers */
    .marker-bar { 
      position: absolute; bottom: 45px; left: 0; width: 100%; height: 10px; 
      background: rgba(255,255,255,0.2); z-index: 500; display: flex; align-items: center;
      pointer-events: none;
    }
    .marker { 
      position: absolute; width: 12px; height: 12px; background: #fff; 
      border-radius: 50%; transform: translateX(-50%); cursor: help;
      box-shadow: 0 0 10px rgba(255,255,255,0.8); transition: transform 0.2s;
      pointer-events: auto;
    }
    .marker:hover { transform: translateX(-50%) scale(1.5); }
    .marker.quiz { background: var(--yt-red, #ff0033); box-shadow: 0 0 10px rgba(255,0,51,0.8); }

    /* Fullscreen Button */
    .btn-fullscreen {
      position: absolute; bottom: 10px; right: 10px; z-index: 600;
      background: rgba(0,0,0,0.5); color: white; border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;
      transition: all 0.2s; -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px);
    }
    .btn-fullscreen:hover { background: rgba(255,255,255,0.2); border-color: white; }

    /* Summary Styles */
    .summary-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 3rem;
      text-align: center;
      animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .success-icon {
      width: 80px; height: 80px; background: #2ecc71; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 2rem; font-size: 40px; color: white;
      box-shadow: 0 0 30px rgba(46, 204, 113, 0.4);
    }
    .stats-grid {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem; margin: 2.5rem 0;
    }
    .stat-item {
      background: rgba(255, 255, 255, 0.03);
      padding: 1.5rem; border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .stat-value { font-size: 2rem; font-weight: 800; color: #fff; display: block; margin-bottom: 0.5rem; }
    .stat-label { font-size: 0.9rem; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px; }
    .final-score { color: #2ecc71; font-weight: 900; }

    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.5s ease-out; }

    /* Hide native YT progress bar if possible or just avoid collision */
    :fullscreen .video-container { width: 100vw; height: 100vh; max-width: none; border-radius: 0; }

  </style>
</head>
<body>
  <div id="video-wrapper" class="video-container">
    <div id="player"></div>
    <div id="marker-bar" class="marker-bar"></div>
    <button class="btn-fullscreen" onclick="toggleFullscreen()">⛶ Plein écran</button>
    <div id="overlay">
      <div id="quiz-view" class="overlay-content" style="display: none;">
        <div id="quiz-question" class="overlay-message">Question ?</div>
        <div id="quiz-options" class="quiz-options"></div>
        <div id="quiz-feedback" class="feedback"></div>
        <button id="quiz-next" class="btn-continue pulse" style="display: none;" onclick="resumeVideo()">Continuer la lecture</button>
      </div>
      <div id="message-view" class="overlay-content" style="display: none;">
        <div id="overlay-msg" class="overlay-message">C'est le temps d'une pause !</div>
        <button class="btn-continue pulse" onclick="resumeVideo()">Continuer la lecture</button>
      </div>
      <div id="summary-view" class="overlay-content" style="display: none;">
        <div class="summary-card">
          <div class="success-icon">✓</div>
          <h2 id="summary-title" class="overlay-message" style="margin-bottom: 0.5rem;">Félicitations !</h2>
          <p style="color: rgba(255,255,255,0.7); font-size: 1.1rem;">Vous avez terminé cette capsule d'apprentissage.</p>
          
          <div class="stats-grid">
            <div class="stat-item">
              <span id="stat-score" class="stat-value final-score">--%</span>
              <span class="stat-label">Score Final</span>
            </div>
            <div class="stat-item">
              <span id="stat-answers" class="stat-value">0/0</span>
              <span class="stat-label">Réponses</span>
            </div>
            <div class="stat-item">
              <span id="stat-progress" class="stat-value">100%</span>
              <span class="stat-label">Progression</span>
            </div>
          </div>

          <button class="btn-continue" onclick="terminateSession()">Enregistrer et Quitter</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    var youtubeVideoId = '${videoId}';
    var strictMode = ${!!strictMode};
    var saveProgress = ${!!saveProgress};
    var freeAccess = ${!!freeAccess};
    var completionThreshold = ${completionThreshold || 100};
    var interactionPoints = ${JSON.stringify(interactions)};

    var player;
    var scormAPI = null;
    var maxTimeWatched = 0;
    var isCompleted = false;
    var currentInteractionIndex = -1;
    var duration = 0;
    var correctAnswersCount = 0;
    var totalQuizzes = interactionPoints.filter(p => p.type === 'quiz').length;

    function findAPI(win) {
      var attempts = 0;
      while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
        attempts++;
        if (attempts > 7) return null;
        win = win.parent;
      }
      return win.API;
    }

    function initSCORM() {
      scormAPI = findAPI(window);
      if (scormAPI) {
        scormAPI.LMSInitialize("");
        var status = scormAPI.LMSGetValue("cmi.core.lesson_status");
        if (status === "completed" || status === "passed") isCompleted = true;
        else scormAPI.LMSSetValue("cmi.core.lesson_status", "incomplete");
        
        if (saveProgress) {
          var suspendData = scormAPI.LMSGetValue("cmi.suspend_data");
          if (suspendData && suspendData !== "") maxTimeWatched = parseFloat(suspendData) || 0;
        }
      }
    }

    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    function onYouTubeIframeAPIReady() {
      initSCORM();
      player = new YT.Player('player', {
        videoId: youtubeVideoId,
        playerVars: { 'rel': 0, 'modestbranding': 1, 'controls': 1, 'fs': 0 },
        events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange }
      });
    }

    function onPlayerReady(event) {
      if (maxTimeWatched > 0 && !isCompleted) player.seekTo(maxTimeWatched, true);
      
      setInterval(function() {
        var currentTime = player.getCurrentTime();
        duration = player.getDuration();
        
        if (duration > 0 && document.getElementById('marker-bar').children.length === 0) {
          renderMarkers(duration);
        }

        checkInteractions(currentTime);

        if (!isCompleted) {
          if (strictMode && currentTime > maxTimeWatched + 2) player.seekTo(maxTimeWatched, true);
          else if (currentTime > maxTimeWatched) maxTimeWatched = currentTime;

          if (duration > 0 && (currentTime / duration * 100) >= completionThreshold) validerAchevement();
        }
      }, 500);
    }

    function renderMarkers(totalDuration) {
      var bar = document.getElementById('marker-bar');
      interactionPoints.forEach(function(point) {
        var marker = document.createElement('div');
        marker.className = 'marker' + (point.type === 'quiz' ? ' quiz' : '');
        marker.style.left = (point.time / totalDuration * 100) + '%';
        bar.appendChild(marker);
      });
    }

    function checkInteractions(time) {
      for (var i = 0; i < interactionPoints.length; i++) {
        var point = interactionPoints[i];
        if (point.time > 0 && Math.abs(time - point.time) < 0.8 && currentInteractionIndex !== i) {
          pauseAtInteraction(i);
          break;
        }
      }
    }

    function pauseAtInteraction(index) {
      currentInteractionIndex = index;
      player.pauseVideo();
      var point = interactionPoints[index];
      
      document.getElementById('overlay').style.display = 'flex';
      
      if (point.type === 'quiz') {
        renderQuiz(point);
      } else {
        document.getElementById('quiz-view').style.display = 'none';
        document.getElementById('message-view').style.display = 'block';
        document.getElementById('overlay-msg').innerHTML = point.message;
      }
    }

    function renderQuiz(point) {
      document.getElementById('message-view').style.display = 'none';
      document.getElementById('quiz-view').style.display = 'block';
      document.getElementById('quiz-question').innerHTML = point.message;
      document.getElementById('quiz-next').style.display = 'none';
      document.getElementById('quiz-feedback').className = 'feedback';
      document.getElementById('quiz-feedback').innerHTML = '';
      
      var optionsContainer = document.getElementById('quiz-options');
      optionsContainer.innerHTML = '';
      
      point.options.forEach(function(opt, idx) {
        var btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.innerHTML = opt;
        btn.onclick = function() { checkAnswer(idx, point.correct); };
        optionsContainer.appendChild(btn);
      });
    }

    function checkAnswer(selectedIdx, correctIdx) {
      var options = document.querySelectorAll('.quiz-option');
      options.forEach(function(btn) { btn.disabled = true; });
      
      var feedback = document.getElementById('quiz-feedback');
      if (selectedIdx === correctIdx) {
        options[selectedIdx].classList.add('correct');
        feedback.innerHTML = "Excellent ! C'est la bonne réponse.";
        feedback.classList.add('success');
        correctAnswersCount++;
      } else {
        options[selectedIdx].classList.add('wrong');
        options[correctIdx].classList.add('correct');
        feedback.innerHTML = "Désolé, ce n'est pas tout à fait ça. Voici la correction.";
        feedback.classList.add('error');
      }
      
      document.getElementById('quiz-next').style.display = 'inline-block';
    }

    function resumeVideo() {
      document.getElementById('overlay').style.display = 'none';
      player.playVideo();
    }

    function toggleFullscreen() {
      var elem = document.getElementById('video-wrapper');
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }

    function onPlayerStateChange(event) {
      if (event.data == YT.PlayerState.ENDED) validerAchevement();
    }

    function validerAchevement() {
      if (isCompleted) return;
      isCompleted = true;
      
      var finalScore = totalQuizzes > 0 ? Math.round((correctAnswersCount / totalQuizzes) * 100) : 100;
      
      if (scormAPI) {
        scormAPI.LMSSetValue("cmi.core.lesson_status", "completed");
        scormAPI.LMSSetValue("cmi.core.score.raw", finalScore.toString());
        scormAPI.LMSCommit("");
      }
      
      showSummary(finalScore);
    }

    function showSummary(finalScore) {
      document.getElementById('quiz-view').style.display = 'none';
      document.getElementById('message-view').style.display = 'none';
      document.getElementById('summary-view').style.display = 'block';
      document.getElementById('overlay').style.display = 'flex';
      
      document.getElementById('stat-score').innerHTML = finalScore + '%';
      document.getElementById('stat-answers').innerHTML = correctAnswersCount + '/' + totalQuizzes;
      
      if (finalScore < 60) {
        document.getElementById('stat-score').style.color = '#e74c3c';
        document.getElementById('summary-title').innerHTML = "Capsule complétée";
      }
    }

    function terminateSession() {
      if (scormAPI) {
        scormAPI.LMSCommit("");
        scormAPI.LMSFinish("");
      }
      window.top.close();
    }

    window.onbeforeunload = function() {
      if (scormAPI) {
        if (!isCompleted && saveProgress) {
          scormAPI.LMSSetValue("cmi.suspend_data", maxTimeWatched.toString());
        }
        terminateSession();
      }
    };
  </script>
</body>
</html>`;
};
