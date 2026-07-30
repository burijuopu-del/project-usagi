/* save.js — persistance de la progression dans localStorage */

const PB = window.PB || (window.PB = {});

PB.SAVE_KEY = 'project_bunny_save_v1';

PB.defaultState = function () {
  return {
    unlocked: { archive: true, logs: true }, // dossiers debloques
    memoriesRead: [],                        // ids des souvenirs lus
    flags: {                                  // etapes narratives franchies
      analyseDone: false,
      logicSolved: false,
      finalUnlocked: false
    },
    history: [],                              // historique des commandes
    cwd: '/',
    bootSkipped: false
  };
};

PB.loadState = function () {
  try {
    const raw = localStorage.getItem(PB.SAVE_KEY);
    if (!raw) return PB.defaultState();
    const parsed = JSON.parse(raw);
    // fusion defensive avec l'etat par defaut (au cas ou de nouveaux champs existent)
    const base = PB.defaultState();
    return Object.assign(base, parsed, {
      unlocked: Object.assign(base.unlocked, parsed.unlocked || {}),
      flags: Object.assign(base.flags, parsed.flags || {})
    });
  } catch (e) {
    return PB.defaultState();
  }
};

PB.state = PB.loadState();

PB.persist = function () {
  try {
    localStorage.setItem(PB.SAVE_KEY, JSON.stringify(PB.state));
  } catch (e) {
    // stockage indisponible (navigation privee, quota...) — on continue sans sauvegarder
    console.warn('Sauvegarde impossible :', e);
  }
};

PB.resetProgress = function () {
  localStorage.removeItem(PB.SAVE_KEY);
  PB.state = PB.defaultState();
};

PB.unlock = function (folderId) {
  PB.state.unlocked[folderId] = true;
  PB.persist();
};

PB.isUnlocked = function (folderId) {
  return !!PB.state.unlocked[folderId];
};

PB.markMemoryRead = function (id) {
  if (!PB.state.memoriesRead.includes(id)) {
    PB.state.memoriesRead.push(id);
    PB.persist();
  }
};

PB.allMemoriesRead = function (requiredList) {
  return requiredList.every((id) => PB.state.memoriesRead.includes(id));
};
