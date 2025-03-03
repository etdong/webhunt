import kaplay from 'kaplay';

export default function makeKaplayCtx() {
    return kaplay({
        global: false,
        pixelDensity: 2,
        touchToMouse: true,
        debug: true,
        debugKey: 'u',
        canvas: document.getElementById('game') as HTMLCanvasElement,
        background: [255, 255, 255],
    });
}