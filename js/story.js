/* story.js — progression narrative et scene de revelation finale */

const PB = window.PB || (window.PB = {});

PB.REQUIRED_MEMORIES = ['movie', 'rain', 'music', 'october'];

PB.emotionLevel = function () {
  return PB.state.memoriesRead.length; // 0 a 4
};

PB.updateProgressMeter = function () {
  const el = document.getElementById('progress-meter');
  if (!el) return;
  const level = PB.emotionLevel();
  const bars = '#'.repeat(level) + '.'.repeat(4 - level);
  el.textContent = `emotion [${bars}]`;
};

/* Appelee quand un fichier de /memory est lu via 'cat' */
PB.onMemoryRead = function (memoryId, container) {
  if (PB.state.memoriesRead.includes(memoryId)) return;
  PB.markMemoryRead(memoryId);
  PB.updateProgressMeter();
  PB.appendLine(container, '', '');
  PB.appendLine(container, '[Memory detected.]', 'line-success');
  PB.appendLine(container, '[Emotion level increasing...]', 'line-story');
  PB.playSystemBeep('success');
};

/* Photos : convention de nommage attendue dans assets/images/
   photo1.jpg, photo2.jpg, ... photo8.jpg (jusqu'a ce que le fichier n'existe plus) */
PB.buildPhotoGallery = function () {
  const gallery = document.getElementById('photo-gallery');
  gallery.innerHTML = '';
  const maxPhotos = 12;
  let delay = 0;
  for (let i = 1; i <= maxPhotos; i++) {
    const img = new Image();
    const path = `assets/images/photo${i}.jpg`;
    img.onload = () => {
      img.style.animationDelay = `${delay * 0.15}s`;
      delay++;
      gallery.appendChild(img);
    };
    img.onerror = () => {
      // le fichier n'existe pas — on l'ignore silencieusement
    };
    img.src = path;
    img.alt = `Souvenir ${i}`;
  }
};

/* Musique : cherche assets/audio/theme.mp3, sinon masque le lecteur */
PB.setupMusicPlayer = function () {
  const controls = document.getElementById('music-controls');
  const audio = new Audio('assets/audio/theme.mp3');
  let playing = false;
  audio.loop = true;

  const btn = document.createElement('button');
  btn.textContent = '♪ Jouer la musique';
  btn.addEventListener('click', () => {
    if (!playing) {
      audio.play().catch(() => {});
      btn.textContent = '❚❚ Mettre en pause';
      playing = true;
    } else {
      audio.pause();
      btn.textContent = '♪ Jouer la musique';
      playing = false;
    }
  });

  audio.addEventListener('error', () => {
    controls.innerHTML = '';
  });

  controls.innerHTML = '';
  controls.appendChild(btn);
};

PB.FINAL_LETTER = `Bunny-chan,

Si tu lis ces lignes, ca veut dire que tu as traverse tout un systeme
juste pour retrouver... moi. Enfin, la version de moi qui a construit
tout ca en pensant a toi.

Il n'y a jamais eu de serveur a pirater. Il n'y a jamais eu de menace.
Il y avait juste envie de te faire vivre, etape par etape, ce que je
ressens depuis le 1er octobre : cette sensation qu'on a trouve
quelqu'un avec qui meme les differences (toi et l'horreur, moi et les
polars) deviennent des soirees qu'on attend avec impatience.

On n'a pas encore danse sous la pluie. Mais je crois toujours a cette
phrase qu'on aime tous les deux : ceux qui dansent sont pris pour fous
par ceux qui n'entendent pas la musique. Nous, on l'entend.

Merci d'avoir cherche jusqu'au bout.

— avec tout ce que ce systeme ne pourra jamais vraiment mesurer.`;

PB.launchFinalReveal = async function () {
  const terminalScreen = document.getElementById('terminal-screen');
  const revealScreen = document.getElementById('reveal-screen');
  const blackout = document.getElementById('blackout');

  blackout.classList.add('active');
  PB.playSystemBeep('success');
  await new Promise((r) => setTimeout(r, 900));

  terminalScreen.style.display = 'none';
  revealScreen.style.display = 'block';

  const statusEl = document.getElementById('reveal-status');
  const titleEl = document.getElementById('reveal-title');
  const subtitleEl = document.getElementById('reveal-subtitle');

  statusEl.textContent = '';
  titleEl.textContent = '';
  subtitleEl.textContent = '';

  blackout.classList.remove('active');

  await PB.typeLines(statusEl, ['Identity restored.'], { speed: 40, sound: true });
  await new Promise((r) => setTimeout(r, 400));

  titleEl.textContent = 'Stephie';
  titleEl.classList.add('fade-in');
  PB.playSystemBeep('success');
  await new Promise((r) => setTimeout(r, 700));

  subtitleEl.textContent = 'Alias : Bunny-chan';
  subtitleEl.classList.add('fade-in');
  await new Promise((r) => setTimeout(r, 900));

  PB.buildPhotoGallery();
  PB.setupMusicPlayer();

  const letterEl = document.getElementById('final-letter');
  letterEl.textContent = PB.FINAL_LETTER;
  letterEl.classList.add('fade-in');

  const transitionBtn = document.getElementById('transition-btn');
  transitionBtn.style.display = 'inline-block';
};

PB.beginFinalTransition = function () {
  const btn = document.getElementById('transition-btn');
  btn.disabled = true;
  btn.textContent = 'Transfert en cours...';

  const revealScreen = document.getElementById('reveal-screen');
  const status = document.createElement('div');
  status.id = 'transfer-status';
  status.style.marginTop = '20px';
  status.style.color = '#7fbf7f';
  status.style.fontFamily = "'JetBrains Mono', monospace";
  revealScreen.appendChild(status);

  PB.typeLines(status, [
    'Transfer complete.',
    'Destination unlocked.',
    'Redirection en cours...'
  ], { speed: 30 }).then(() => {
    setTimeout(() => {
      window.location.href = PB.FINAL_REDIRECT_URL;
    }, 1200);
  });
};
