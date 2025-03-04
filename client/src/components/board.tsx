import { KAPLAYCtx } from "kaplay";

export default function drawBoard(k: KAPLAYCtx, socket: any, size: number) {
    let side_length = 128 * size;

    let board = k.add([
        k.rect(side_length + 8, side_length + 8, { fill: false, radius: 16}),
        k.anchor('center'),
        k.pos(k.center()),
        k.outline(4),
    ])

    return board;
}