import { KAPLAYCtx } from "kaplay";

export function draw_with_tiles(k: KAPLAYCtx, title: string) {
    let letters = [];
    for (let i = 0; i < title.length; i++) {
        let letter = k.add([
            k.anchor('center'),
            k.polygon([
                k.vec2(118, 118),
                k.vec2(128, 100),
                k.vec2(128, -100),
                k.vec2(118, -118),
                k.vec2(100, -128),
                k.vec2(-100, -128),
                k.vec2(-118, -118),
                k.vec2(-128, -100),
                k.vec2(-128, 100),
                k.vec2(-118, 118),
                k.vec2(-100, 128),
                k.vec2(100, 128),

            ], {fill: false}),
            k.outline(6),
            k.area(),
            k.body(),
            k.pos(k.width() / 2 - title.length/2 * 128 + i * 164, k.center().y - 256),
            k.scale(0.5),
            k.offscreen({
                hide: true,
                distance: 64,
            }),
            'letter',
            title.charAt(i),
        ]);

        letters.push(letter);
    }
    return letters;
}