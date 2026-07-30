/* commands.js — dispatcher et implementation des commandes simulees */

const PB = window.PB || (window.PB = {});

PB.HOSTNAME = 'bunny';
PB.USER = 'root';

PB.getPromptPath = function () {
  return PB.state.cwd === '/' ? '~' : PB.state.cwd;
};

PB.HELP_TEXT = [
  'Commandes disponibles :',
  '  help          - affiche cette aide',
  '  ls [-a]       - liste le contenu du dossier courant',
  '  cd <dossier>  - change de dossier',
  '  pwd           - affiche le dossier courant',
  '  cat <fichier> - affiche le contenu d\'un fichier',
  '  tree          - affiche l\'arborescence complete',
  '  find <nom>    - recherche un fichier par son nom',
  '  grep <mot>    - recherche un mot dans tous les fichiers accessibles',
  '  whoami        - affiche l\'utilisateur courant',
  '  history       - affiche l\'historique des commandes',
  '  clear         - vide le terminal',
  '  nano <fichier>- ouvre un fichier en lecture',
  '  ssh <cible>   - tente une connexion distante',
  '  chmod ...     - modifie les permissions (simule)',
  '  sudo <cmd>    - execute une commande avec privileges',
  '  journalctl    - affiche le journal systeme',
  '  ip a          - affiche la configuration reseau',
  '  hostnamectl   - affiche les informations de la machine',
  '  decode <texte>- decode un texte (morse / base64 / cesar)',
  '  analyse       - analyse les fragments memoire collectes',
  '  repondre <..> - repond a une enigme en cours',
  ''
];

PB.ALL_COMMANDS = ['help','ls','cd','pwd','cat','tree','find','grep','whoami','history',
  'clear','nano','ssh','chmod','sudo','journalctl','decode','analyse','repondre','run','sh'];

PB.autocomplete = function (partial) {
  const matches = PB.ALL_COMMANDS.filter((c) => c.startsWith(partial));
  return matches;
};

function lockedMessage(folderId) {
  const folder = PB.getFolder(folderId);
  return [
    'ACCESS DENIED',
    `Ce dossier necessite un niveau d'acces superieur (${folder && folder.requires ? folder.requires : '?'}).`
  ];
}

PB.printTree = function (out) {
  PB.appendLine(out, '/');
  Object.keys(PB.fs.folders).forEach((id) => {
    const folder = PB.fs.folders[id];
    const locked = PB.isFolderLocked(id);
    PB.appendLine(out, `├── ${id}${locked ? '  [LOCKED]' : ''}`, locked ? 'line-dim' : 'line-system');
    if (!locked) {
      folder.files.filter((f) => !f.hidden).forEach((f) => {
        PB.appendLine(out, `│   └── ${f.name}`, 'line-dim');
      });
    }
  });
};

function handleCd(arg, out) {
  if (!arg || arg === '~' || arg === '/') {
    PB.state.cwd = '/';
    PB.persist();
    return;
  }
  const target = PB.resolvePath(arg, PB.state.cwd);
  const folderId = PB.folderIdFromPath(target);
  const folder = PB.getFolder(folderId);
  if (!folder) {
    PB.appendLine(out, `cd: ${arg}: dossier introuvable`, 'line-error');
    return;
  }
  if (PB.isFolderLocked(folderId)) {
    lockedMessage(folderId).forEach((l) => PB.appendLine(out, l, 'line-error'));
    PB.playSystemBeep('error');
    return;
  }
  PB.state.cwd = '/' + folderId;
  PB.persist();
  PB.updatePromptLabel();
}

function handleLs(args, out) {
  const showHidden = args.includes('-a');
  if (PB.state.cwd === '/') {
    Object.keys(PB.fs.folders).forEach((id) => {
      const locked = PB.isFolderLocked(id);
      PB.appendLine(out, `${id}/${locked ? '  [LOCKED]' : ''}`, locked ? 'line-dim' : 'line-system');
    });
    return;
  }
  const folderId = PB.folderIdFromPath(PB.state.cwd);
  if (PB.isFolderLocked(folderId)) {
    lockedMessage(folderId).forEach((l) => PB.appendLine(out, l, 'line-error'));
    return;
  }
  const files = PB.listVisibleFiles(folderId, showHidden);
  if (files.length === 0) {
    PB.appendLine(out, '(dossier vide)', 'line-dim');
    return;
  }
  files.forEach((f) => PB.appendLine(out, f.name, f.hidden ? 'line-dim' : ''));
}

function handleCat(arg, out) {
  if (!arg) {
    PB.appendLine(out, 'cat: nom de fichier manquant', 'line-error');
    return;
  }
  const folderId = PB.folderIdFromPath(PB.state.cwd);
  if (PB.state.cwd === '/' || !folderId) {
    PB.appendLine(out, 'cat: aucun fichier ici, deplace-toi dans un dossier', 'line-error');
    return;
  }
  if (PB.isFolderLocked(folderId)) {
    lockedMessage(folderId).forEach((l) => PB.appendLine(out, l, 'line-error'));
    return;
  }
  const file = PB.findFile(folderId, arg);
  if (!file) {
    PB.appendLine(out, `cat: ${arg}: fichier introuvable`, 'line-error');
    return;
  }
  file.content.split('\n').forEach((l) => PB.appendLine(out, l, 'line-story'));

  if (file.memoryId) {
    PB.onMemoryRead(file.memoryId, out);
  }
}

function handleFind(arg, out) {
  if (!arg) {
    PB.appendLine(out, 'find: precise un nom de fichier a rechercher', 'line-error');
    return;
  }
  const results = PB.searchAll((f) => f.name.toLowerCase().includes(arg.toLowerCase()));
  if (results.length === 0) {
    PB.appendLine(out, 'Aucun resultat.', 'line-dim');
    return;
  }
  results.forEach((r) => PB.appendLine(out, `/${r.folderId}/${r.file.name}`, 'line-system'));
}

function handleGrep(arg, out) {
  if (!arg) {
    PB.appendLine(out, 'grep: precise un mot a rechercher', 'line-error');
    return;
  }
  const results = PB.searchAll((f) => f.content.toLowerCase().includes(arg.toLowerCase()));
  if (results.length === 0) {
    PB.appendLine(out, 'Aucun resultat.', 'line-dim');
    return;
  }
  results.forEach((r) => {
    const line = r.file.content.split('\n').find((l) => l.toLowerCase().includes(arg.toLowerCase()));
    PB.appendLine(out, `/${r.folderId}/${r.file.name}: ${line}`, 'line-system');
  });
}

function handleDecode(arg, out) {
  if (!arg) {
    PB.appendLine(out, 'decode: precise un texte a decoder', 'line-error');
    return;
  }
  const { type, result } = PB.smartDecode(arg);
  if (!result) {
    PB.appendLine(out, 'Decodage impossible : format non reconnu.', 'line-error');
    return;
  }
  PB.appendLine(out, `[${type}] -> ${result}`, 'line-system');

  const normalized = result.trim().toUpperCase();

  if (normalized === 'ACCES' && !PB.isUnlocked('security')) {
    PB.unlock('security');
    ['Privilege increased.', "Nouveau dossier disponible : /security"].forEach((l) =>
      PB.appendLine(out, l, 'line-success')
    );
    PB.playSystemBeep('success');
  }

  if (normalized === 'BUNNYCHAN' && !PB.isUnlocked('memory')) {
    PB.unlock('memory');
    ['Privilege increased.', 'Nouveau dossier disponible : /memory'].forEach((l) =>
      PB.appendLine(out, l, 'line-success')
    );
    PB.playSystemBeep('success');
  }
}

function handleAnalyse(out) {
  if (!PB.allMemoriesRead(PB.REQUIRED_MEMORIES)) {
    PB.appendLine(out, 'Analyse impossible : fragments memoire manquants.', 'line-error');
    const missing = PB.REQUIRED_MEMORIES.filter((id) => !PB.state.memoriesRead.includes(id));
    PB.appendLine(out, `Fragments restants : ${missing.join(', ')}`, 'line-dim');
    return;
  }
  if (PB.state.flags.analyseDone) {
    PB.appendLine(out, 'Analyse deja effectuee. Dossier /identity disponible.', 'line-dim');
    return;
  }
  PB.state.flags.analyseDone = true;
  PB.persist();
  PB.unlock('identity');
  ['Correlation des 4 fragments en cours...', 'Target unknown -> Subject found.',
   'Privilege increased.', 'Nouveau dossier disponible : /identity'].forEach((l, idx) =>
    PB.appendLine(out, l, idx < 2 ? 'line-story' : 'line-success')
  );
  PB.playSystemBeep('success');
}

function handleRepondre(arg, out) {
  if (!arg) {
    PB.appendLine(out, 'repondre: precise ta reponse', 'line-error');
    return;
  }
  // Enigme logique (Nietzsche)
  if (!PB.state.flags.logicSolved && PB.checkLogicAnswer(arg)) {
    PB.state.flags.logicSolved = true;
    PB.persist();
    PB.unlock('restricted');
    ['Reponse correcte.',
     "'Ceux qui dansent sont pris pour fous par ceux qui n'entendent pas la musique.'",
     'Privilege increased. Acces a /restricted debloque.'].forEach((l) =>
      PB.appendLine(out, l, 'line-success')
    );
    PB.playSystemBeep('success');
    return;
  }
  PB.appendLine(out, 'Reponse incorrecte.', 'line-error');
  PB.triggerGlitch(250);
}

function handleSudo(argsStr, out) {
  const parts = argsStr.trim().split(/\s+/);
  if (parts[0] === 'unlock' && parts[1] === 'final') {
    if (!PB.state.flags.logicSolved) {
      PB.appendLine(out, "ACCESS DENIED — resous d'abord l'enigme de /project_bunny", 'line-error');
      return;
    }
    PB.appendLine(out, "Mot de passe requis. Utilise : repondre <surnom>", 'line-warn');
    PB.pendingFinalPassword = true;
    return;
  }
  PB.appendLine(out, `sudo: commande "${argsStr}" non reconnue dans ce contexte`, 'line-error');
}

function handleRun(arg, out) {
  const folderId = PB.folderIdFromPath(PB.state.cwd);
  if (folderId !== 'final' || !PB.isUnlocked('final')) {
    PB.appendLine(out, 'run: aucun executable trouve ici', 'line-error');
    return;
  }
  if (arg === 'reveal.sh') {
    PB.appendLine(out, 'Lancement de la sequence finale...', 'line-success');
    setTimeout(() => PB.launchFinalReveal(), 800);
  } else {
    PB.appendLine(out, `run: ${arg}: introuvable`, 'line-error');
  }
}

/* Point d'entree principal : execute une ligne de commande brute */
PB.executeCommand = function (raw, out) {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return;

  PB.state.history.push(trimmed);
  PB.persist();

  const [cmd, ...rest] = trimmed.split(/\s+/);
  const argStr = trimmed.slice(cmd.length).trim();
  const lowerCmd = cmd.toLowerCase();

  switch (lowerCmd) {
    case 'help':
      PB.HELP_TEXT.forEach((l) => PB.appendLine(out, l, 'line-system'));
      break;

    case 'ls':
      handleLs(rest, out);
      break;

    case 'cd':
      handleCd(rest[0], out);
      break;

    case 'pwd':
      PB.appendLine(out, PB.state.cwd, '');
      break;

    case 'cat':
      handleCat(argStr, out);
      break;

    case 'nano':
      PB.appendLine(out, '[mode lecture seule — edition desactivee sur ce systeme]', 'line-dim');
      handleCat(argStr, out);
      break;

    case 'tree':
      PB.printTree(out);
      break;

    case 'find':
      handleFind(argStr, out);
      break;

    case 'grep':
      handleGrep(argStr, out);
      break;

    case 'whoami':
      PB.appendLine(out, `${PB.USER}  (statut : intrus... ou pas)`, '');
      break;

    case 'history':
      PB.state.history.forEach((h, i) => PB.appendLine(out, `${i + 1}  ${h}`, 'line-dim'));
      break;

    case 'clear':
      out.innerHTML = '';
      break;

    case 'ssh':
      PB.appendLine(out, `ssh: connexion a "${argStr || 'cible inconnue'}" refusee (permission denied).`, 'line-error');
      break;

    case 'chmod':
      PB.appendLine(out, `Permissions modifiees (simulation) : ${argStr}`, 'line-dim');
      break;

    case 'sudo':
      handleSudo(argStr, out);
      break;

    case 'journalctl':
      ['-- Journal systeme --',
       'kernel: BUNNY-CORE actif depuis boot.',
       'systemd: tous les services critiques sont operationnels.',
       "auth: un acces non autorise a ete tente puis... abandonne."].forEach((l) =>
        PB.appendLine(out, l, 'line-dim')
      );
      break;

    case 'ip':
      if (rest[0] === 'a' || rest[0] === 'addr') {
        ['eth0: <UP,BROADCAST,RUNNING>',
         '    inet 10.13.10.1/24 scope global',
         '    inet6 fe80::b:00b:5/64 scope link'].forEach((l) => PB.appendLine(out, l, 'line-dim'));
      } else {
        PB.appendLine(out, 'ip: sous-commande inconnue (essaie "ip a")', 'line-error');
      }
      break;

    case 'hostnamectl':
      [`Static hostname: ${PB.HOSTNAME}`,
       'Operating System : BunnyOS 12 (kali-based)',
       'Kernel: Linux 6.6.0-bunny',
       'Architecture: x86-64'].forEach((l) => PB.appendLine(out, l, 'line-dim'));
      break;

    case 'decode':
      handleDecode(argStr, out);
      break;

    case 'analyse':
    case 'analyze':
      handleAnalyse(out);
      break;

    case 'repondre':
    case 'answer':
      handleRepondre(argStr, out);
      break;

    case 'run':
    case 'sh':
      handleRun(rest[0] || argStr, out);
      break;

    default:
      PB.appendLine(out, `${cmd}: commande introuvable. Tape "help" pour la liste des commandes.`, 'line-error');
      PB.maybeInjectNoise(out, 0.08);
  }
};
