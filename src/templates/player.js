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
    .video-container { width: 100%; max-width: 1000px; aspect-ratio: 16 / 9; background: #000; position: relative; box-shadow: 0 40px 100px rgba(0,0,0,0.8); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
    #player { width: 100%; height: 100%; }
    #overlay { 
      position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(15,15,15,0.92); display: none; flex-direction: column; 
      align-items: center; justify-content: center; transition: opacity 0.4s ease; 
      z-index: 100; -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
    }
    .overlay-content { text-align: center; max-width: 80%; }
    .overlay-message { 
      font-size: 2rem; margin-bottom: 2.5rem; color: #ffffff; font-weight: 800; 
      line-height: 1.2; text-shadow: 0 4px 20px rgba(255,0,51,0.5);
    }
    .btn-continue { 
      background: linear-gradient(135deg, #FF0033 0%, #CC0029 100%); 
      color: white; border: none; padding: 16px 40px; 
      border-radius: 50px; font-size: 1.2rem; cursor: pointer; font-weight: 700;
      box-shadow: 0 10px 30px rgba(255,0,51,0.4);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      text-transform: uppercase; letter-spacing: 1px;
    }
    .btn-continue:hover { transform: scale(1.1); box-shadow: 0 15px 40px rgba(255,0,51,0.6); }
    .btn-continue:active { transform: scale(0.95); }

    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.02); opacity: 0.9; }
      100% { transform: scale(1); opacity: 1; }
    }
    .pulse { animation: pulse 2s infinite ease-in-out; }
  </style>
</head>
<body>
  <div class="video-container">
    <div id="player"></div>
    <div id="overlay">
      <div class="overlay-content">
        <div id="overlay-msg" class="overlay-message">C'est le temps d'une pause interactive !</div>
        <button class="btn-continue" onclick="resumeVideo()">Continuer la lecture</button>
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
    var checkInterval;
    var currentInteractionIndex = -1;

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
        if (status === "completed" || status === "passed") {
          isCompleted = true;
        } else {
          scormAPI.LMSSetValue("cmi.core.lesson_status", "incomplete");
        }
        if (saveProgress) {
          var suspendData = scormAPI.LMSGetValue("cmi.suspend_data");
          if (suspendData && suspendData !== "") {
            maxTimeWatched = parseFloat(suspendData) || 0;
          }
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
        playerVars: { 'rel': 0, 'modestbranding': 1, 'controls': 1 },
        events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange }
      });
    }

    function onPlayerReady(event) {
      if (maxTimeWatched > 0 && !isCompleted) {
        player.seekTo(maxTimeWatched, true);
      }
      
      checkInterval = setInterval(function() {
        var currentTime = player.getCurrentTime();
        var duration = player.getDuration();
        
        // Handle Interaction Points
        checkInteractions(currentTime);

        if (!isCompleted) {
          // Strict Navigation Mode
          if (strictMode && !isCompleted && currentTime > maxTimeWatched + 2) {
            player.seekTo(maxTimeWatched, true);
          } else if (currentTime > maxTimeWatched) {
            maxTimeWatched = currentTime;
          }

          // Check Completion Threshold
          if (duration > 0 && (currentTime / duration * 100) >= completionThreshold) {
            validerAchevement();
          }
        }
      }, 500);
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
      document.getElementById('overlay-msg').innerText = interactionPoints[index].message;
      document.getElementById('overlay').style.display = 'flex';
    }

    function resumeVideo() {
      document.getElementById('overlay').style.display = 'none';
      player.playVideo();
    }

    function onPlayerStateChange(event) {
      if (event.data == YT.PlayerState.ENDED) {
        validerAchevement();
      }
    }

    function validerAchevement() {
      if (isCompleted) return;
      isCompleted = true;
      if (scormAPI) {
        scormAPI.LMSSetValue("cmi.core.lesson_status", "completed");
        scormAPI.LMSSetValue("cmi.core.score.raw", "100");
        scormAPI.LMSCommit("");
      }
    }

    window.onbeforeunload = function() {
      if (scormAPI) {
        if (!isCompleted && saveProgress) {
          scormAPI.LMSSetValue("cmi.suspend_data", maxTimeWatched.toString());
        }
        scormAPI.LMSCommit("");
        scormAPI.LMSFinish("");
      }
    };
  </script>
</body>
</html>`;
};
