/* boot.js — sequence de demarrage cinematique avant le terminal */

const PB = window.PB || (window.PB = {});

PB.BOOT_SEQUENCE = [
  { text: 'BUNNY-BIOS (C) 2024  --  UEFI Firmware v3.14', cls: '' },
  { text: 'Initializing hardware...', cls: 'boot-dim' },
  { text: 'CPU  : Intel(R) Core(TM) Heart-Sync @ 3.60GHz  [OK]', cls: 'boot-ok' },
  { text: 'RAM  : 16384 MB detected  [OK]', cls: 'boot-ok' },
  { text: 'DISK : /dev/sda1  512 GB  [OK]', cls: 'boot-ok' },
  { text: 'Network adapter detected : eth0  [OK]', cls: 'boot-ok' },
  { text: '', cls: '' },
  { text: 'Booting from /dev/sda1 ...', cls: 'boot-dim' },
  { text: '', cls: '' },
  { text: 'GNU GRUB  version 2.12', cls: '' },
  { text: '> BunnyOS GNU/Linux (kali-based)', cls: 'boot-ok' },
  { text: '  Advanced options for BunnyOS', cls: 'boot-dim' },
  { text: '', cls: '' },
  { text: 'Loading Linux kernel 6.6.0-bunny ...', cls: 'boot-dim' },
  { text: '[  0.102384] Initializing cgroup subsys cpuset', cls: 'boot-dim' },
  { text: '[  0.204471] Initializing emotional_core module', cls: 'boot-warn' },
  { text: '[  0.481233] ACPI: bunny_core registered', cls: 'boot-dim' },
  { text: '[  1.002914] Mounting root filesystem...  [OK]', cls: 'boot-ok' },
  { text: '[  1.203981] Starting systemd services...', cls: 'boot-dim' },
  { text: '[  1.512233]  -> network.service        [OK]', cls: 'boot-ok' },
  { text: '[  1.612094]  -> auth.service           [OK]', cls: 'boot-ok' },
  { text: '[  1.703312]  -> memory_scan.service    [OK]', cls: 'boot-ok' },
  { text: '[  1.881233]  -> unknown_process.service [WARN]', cls: 'boot-warn' },
  { text: '[  2.014521] Verifying integrite des fichiers systeme...', cls: 'boot-dim' },
  { text: '[  2.301233] 4/4 fichiers critiques verifies  [OK]', cls: 'boot-ok' },
  { text: '', cls: '' },
  { text: 'Systeme pret.', cls: 'boot-ok' },
  { text: 'Lancement de la session...', cls: 'boot-dim' }
];

PB.runBootSequence = async function () {
  const bootScreen = document.getElementById('boot-screen');
  const linesEl = document.getElementById('boot-lines');
  const progressBar = document.getElementById('boot-progress-bar');
  const terminalScreen = document.getElementById('terminal-screen');
  const skipBtn = document.getElementById('boot-skip');

  function finishBoot() {
    bootScreen.style.display = 'none';
    terminalScreen.style.display = 'block';
    PB.initTerminal();
  }

  if (PB.state.bootSkipped) {
    finishBoot();
    return;
  }

  skipBtn.addEventListener('click', () => {
    PB.state.bootSkipped = true;
    PB.persist();
    finishBoot();
  });

  bootScreen.style.display = 'block';

  for (let i = 0; i < PB.BOOT_SEQUENCE.length; i++) {
    const { text, cls } = PB.BOOT_SEQUENCE[i];
    const p = document.createElement('div');
    p.className = cls;
    p.textContent = text;
    linesEl.appendChild(p);
    progressBar.style.width = `${Math.round(((i + 1) / PB.BOOT_SEQUENCE.length) * 100)}%`;
    if (text.trim().length > 0 && Math.random() < 0.3) PB.playKeySound();
    await new Promise((r) => setTimeout(r, text.trim().length === 0 ? 120 : 90 + Math.random() * 90));
  }

  await new Promise((r) => setTimeout(r, 500));
  finishBoot();
};
