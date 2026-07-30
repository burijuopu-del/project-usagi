/* filesystem.js — systeme de fichiers virtuel charge depuis data/filesystem.json */

const PB = window.PB || (window.PB = {});

PB.fs = null; // rempli par PB.loadFilesystem()

PB.loadFilesystem = async function () {
  try {
    const res = await fetch('data/filesystem.json');
    if (!res.ok) throw new Error('reponse HTTP ' + res.status);
    PB.fs = await res.json();
  } catch (e) {
    console.error('Impossible de charger data/filesystem.json :', e);
    PB.fs = null;
  }
  return PB.fs;
};

/* Resout un chemin (absolu ou relatif au cwd) vers un nom de dossier connu */
PB.resolvePath = function (input, cwd) {
  if (!input || input === '~' || input === '/') return '/';
  let target = input;
  if (!target.startsWith('/')) {
    target = cwd === '/' ? '/' + target : cwd + '/' + target;
  }
  target = target.replace(/\/+/g, '/');
  if (target.length > 1 && target.endsWith('/')) target = target.slice(0, -1);
  return target;
};

PB.folderIdFromPath = function (path) {
  if (path === '/' || path === '') return null;
  return path.replace(/^\//, '').split('/')[0];
};

PB.getFolder = function (folderId) {
  if (!PB.fs || !folderId) return null;
  return PB.fs.folders[folderId] || null;
};

PB.isFolderLocked = function (folderId) {
  const folder = PB.getFolder(folderId);
  if (!folder) return false;
  if (!folder.locked) return false;
  return !PB.isUnlocked(folderId);
};

PB.listVisibleFiles = function (folderId, showHidden = false) {
  const folder = PB.getFolder(folderId);
  if (!folder) return [];
  return folder.files.filter((f) => showHidden || !f.hidden);
};

PB.findFile = function (folderId, filename) {
  const folder = PB.getFolder(folderId);
  if (!folder) return null;
  const clean = filename.replace(/^\.\//, '');
  return folder.files.find((f) => f.name === clean) || null;
};

/* Recherche recursive simple (utilisee par 'find' et 'grep') */
PB.searchAll = function (predicate) {
  const results = [];
  if (!PB.fs) return results;
  Object.keys(PB.fs.folders).forEach((folderId) => {
    if (PB.isFolderLocked(folderId)) return;
    const folder = PB.fs.folders[folderId];
    folder.files.forEach((file) => {
      if (predicate(file, folderId)) {
        results.push({ folderId, file });
      }
    });
  });
  return results;
};
