import { KAPLAYCtx } from "kaplay";

export default function drawBoard(k: KAPLAYCtx, size: number) {
    let side_length = 128 * size;

    let board = k.add([
        k.rect(side_length + 8, side_length + 8, { fill: false, radius: 16}),
        k.anchor('center'),
        k.pos(k.center()),
        k.outline(4),
    ])

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let char = String.fromCharCode(65 + Math.floor(Math.random() * 26))

            k.add([
                k.sprite(char),
                k.scale(0.5),
                k.area({ shape: new k.Polygon([
                    k.vec2(96, 0),
                    k.vec2(160, 0),
                    k.vec2(256, 96),
                    k.vec2(256, 160),
                    k.vec2(160, 256),
                    k.vec2(96, 256),
                    k.vec2(0, 160),
                    k.vec2(0, 96),
                ])}),
                k.pos(k.center().sub(side_length/2 - i * 128, side_length/2 - j * 128)),
                char,
                'letter',
            ])
        }   
    }

    return board;
}