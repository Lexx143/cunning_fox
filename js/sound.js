// ================= Звук: эффекты и фоновая музыка =================
// SFX: CC0-паки Kenney (assets/sfx/CREDITS.txt)

const Sound = (() => {
    const SFX_FILES = {
        click:      'click.wav',
        diceShake:  'dice-shake.ogg',
        diceThrow:  'dice-throw.ogg',
        cardFlip:   'card-flip.ogg',
        cardDeal:   'card-deal.ogg',
        step:       'step.ogg',
        foxRun:     'fox-run.ogg',
        clue:       'clue.ogg',
        success:    'success.ogg',
        fail:       'fail.ogg',
        wrong:      'wrong.ogg',
        win:        'win.ogg',
        lose:       'lose.ogg',
    };
    const MUSIC_FILE = 'assets/music/theme.mp3';

    const buffers = {};
    let sfxOn = localStorage.getItem('dg_sfx') !== '0';
    let musicOn = localStorage.getItem('dg_music') !== '0';
    let unlocked = false;
    let musicEl = null;
    let musicAvailable = false;

    // предзагрузка через HTMLAudio-пул (просто и достаточно для коротких эффектов)
    function preload() {
        for (const [name, file] of Object.entries(SFX_FILES)) {
            const a = new Audio('assets/sfx/' + file);
            a.preload = 'auto';
            buffers[name] = a;
        }
        musicEl = new Audio(MUSIC_FILE);
        musicEl.loop = true;
        musicEl.volume = 0.35;
        musicEl.preload = 'auto';
        musicEl.addEventListener('canplaythrough', () => { musicAvailable = true; });
        musicEl.addEventListener('error', () => { musicAvailable = false; });
    }

    function play(name, volume = 1) {
        if (!sfxOn || !buffers[name]) return;
        try {
            const a = buffers[name].cloneNode();
            a.volume = volume;
            a.play().catch(() => {});
        } catch (e) { /* без звука лучше, чем с ошибкой */ }
    }

    function startMusicIfAllowed() {
        if (musicOn && unlocked && musicEl && musicAvailable) {
            musicEl.play().catch(() => {});
        }
    }

    // мобильные браузеры требуют жеста пользователя для старта аудио
    function unlock() {
        if (unlocked) return;
        unlocked = true;
        startMusicIfAllowed();
    }

    function setSfx(on) {
        sfxOn = on;
        localStorage.setItem('dg_sfx', on ? '1' : '0');
    }

    function setMusic(on) {
        musicOn = on;
        localStorage.setItem('dg_music', on ? '1' : '0');
        if (!musicEl) return;
        if (on) startMusicIfAllowed();
        else musicEl.pause();
    }

    // пауза музыки при сворачивании приложения
    document.addEventListener('visibilitychange', () => {
        if (!musicEl) return;
        if (document.hidden) musicEl.pause();
        else startMusicIfAllowed();
    });

    return {
        preload, play, unlock, setSfx, setMusic,
        get sfxOn() { return sfxOn; },
        get musicOn() { return musicOn; },
    };
})();
