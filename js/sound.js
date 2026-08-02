// ================= Звук: эффекты и фоновая музыка =================
// SFX: CC0-паки Kenney (assets/sfx/CREDITS.txt)

const Sound = (() => {
    // файл + базовая громкость (звуки смягчены, чтобы не резали слух)
    // файлы нормализованы к одному уровню (−16 LUFS) — коэффициенты
    // задают только осознанные различия, а не компенсируют разнобой
    const SFX_FILES = {
        click:      ['click.wav', 0.3],
        diceShake:  ['dice-shake.ogg', 0.5],
        diceThrow:  ['dice-throw.ogg', 0.5],
        cardFlip:   ['card-flip.ogg', 0.5],
        cardDeal:   ['card-deal.ogg', 0.5],
        step:       ['step.ogg', 0.45],
        foxRun:     ['fox-run.ogg', 0.5],
        clue:       ['clue.ogg', 0.5],
        success:    ['success.ogg', 0.5],
        fail:       ['fail.ogg', 0.5],
        wrong:      ['wrong.ogg', 0.5],
        win:        ['win.ogg', 0.6],
        lose:       ['lose.ogg', 0.55],
    };
    const MUSIC_FILE = 'assets/music/theme.mp3';

    const buffers = {};
    let sfxOn = localStorage.getItem('dg_sfx') !== '0';
    let musicOn = localStorage.getItem('dg_music') !== '0';
    let unlocked = false;
    let musicEl = null;
    let musicAvailable = false;

    // предзагрузка через HTMLAudio-пул (просто и достаточно для коротких эффектов)
    const SND_V = '3'; // версия аудио — сбрасывает кэш браузера при замене файлов

    function preload() {
        for (const [name, [file]] of Object.entries(SFX_FILES)) {
            const a = new Audio('assets/sfx/' + file + '?v=' + SND_V);
            a.preload = 'auto';
            buffers[name] = a;
        }
        musicEl = new Audio(MUSIC_FILE + '?v=' + SND_V);
        musicEl.loop = true;
        musicEl.volume = 0.35;
        musicEl.preload = 'auto';
        musicEl.addEventListener('canplaythrough', () => { musicAvailable = true; });
        musicEl.addEventListener('error', () => { musicAvailable = false; });
    }

    function play(name, mult = 1) {
        if (!sfxOn || !buffers[name]) return;
        try {
            const a = buffers[name].cloneNode();
            a.volume = Math.min(1, SFX_FILES[name][1] * mult);
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
