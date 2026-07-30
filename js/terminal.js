/* terminal.js — interface interactive du terminal */

const PB = window.PB || (window.PB = {});

PB.historyCursor = -1;

PB.updatePromptLabel = function () {
  const label = document.getElementById('prompt-label');
  if (label) label.textContent = `${PB.USER}@${PB.HOSTNAME}:${PB.getPromptPath()}#`;
};

PB.introSequence = [
  'Bienvenue sur BUNNY-CORE.',
  "Systeme d'exploitation charge avec succes.",
  "Aucune menace critique detectee pour l'instant.",
  '',
  "Tape 'help' pour afficher les commandes disponibles.",
  ''
];

PB.initTerminal = async function () {
  await PB.loadFilesystem();

  const output = document.getElementById('terminal-output');
  const input = document.getElementById('terminal-input');

  PB.updatePromptLabel();
  PB.updateProgressMeter();

  if (!PB.fs) {
    PB.appendLine(output, 'ERREUR CRITIQUE : impossible de charger le systeme de fichiers.', 'line-error');
    PB.appendLine(output, "Astuce : ouvre ce site via GitHub Pages ou un serveur local (pas en fichier local direct).", 'line-warn');
  } else {
    await PB.typeLines(output, PB.introSequence, { speed: 12, lineDelay: 90, cls: 'line-system' });
  }

  input.disabled = false;
  input.focus();

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const raw = input.value;
      PB.appendLine(output, `${PB.USER}@${PB.HOSTNAME}:${PB.getPromptPath()}# ${raw}`, 'line-echo');
      input.value = '';
      PB.historyCursor = -1;
      try {
        PB.executeCommand(raw, output);
      } catch (err) {
        console.error(err);
        PB.appendLine(output, 'Erreur interne du systeme. On continue quand meme.', 'line-error');
      }
      PB.updatePromptLabel();
      PB.updateProgressMeter();
      output.scrollTop = output.scrollHeight;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const hist = PB.state.history;
      if (hist.length === 0) return;
      if (PB.historyCursor === -1) PB.historyCursor = hist.length - 1;
      else if (PB.historyCursor > 0) PB.historyCursor--;
      input.value = hist[PB.historyCursor] || '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const hist = PB.state.history;
      if (PB.historyCursor === -1) return;
      if (PB.historyCursor < hist.length - 1) {
        PB.historyCursor++;
        input.value = hist[PB.historyCursor] || '';
      } else {
        PB.historyCursor = -1;
        input.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const partial = input.value.trim();
      if (!partial) return;
      const matches = PB.autocomplete(partial);
      if (matches.length === 1) {
        input.value = matches[0] + ' ';
      } else if (matches.length > 1) {
        PB.appendLine(output, matches.join('   '), 'line-dim');
      }
    } else {
      PB.playKeySound();
    }
  });

  // occasionnellement, un petit bruit systeme pendant que le joueur explore
  setInterval(() => {
    if (document.activeElement === input && Math.random() < 0.04) {
      PB.maybeInjectNoise(output, 1);
    }
  }, 15000);
};

/* Bouton de reinitialisation (accessible via console si besoin, discret) */
window.resetProjectBunny = function () {
  PB.resetProgress();
  location.reload();
};
