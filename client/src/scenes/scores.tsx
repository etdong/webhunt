import { KAPLAYCtx } from "kaplay";
import { updateCamPos, updateCamZoom } from "../utils/camUtils";

import socket from "src/components/socket";

export default function init_scores(k: KAPLAYCtx) {
    k.scene('scores', (room_id) => {

        socket.emit('signal_finish', socket.id, room_id);
        
        let scores: [string, number][] = []

        k.add([
            k.text('final scores', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x, k.center().y - 360),
            k.anchor('center'),
            k.color(0, 0, 0),
        ])

        let scores_container = k.add([
            k.rect(512, 512, { fill: false }),
            k.pos(k.center().sub(0, 40)),
            k.anchor('center'),
            k.outline(4)
        ])

        let back = k.add([
            k.text('done', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x, k.center().y + 320),
            k.anchor('center'),
            k.area(),
            k.color(0, 0, 0),
            k.scale(1),
            'menu_button',
        ])

        socket.off('update_scores').on('update_scores', (data: [string, number][]) => {
            scores = data;
        })

        back.onClick(() => {
            k.go('room');
        })

        k.onHover('menu_button', (btn) => {
            k.tween(
                btn.scale,
                k.vec2(1.2),
                0.1,
                (newScale) => btn.scale = newScale,
                k.easings.linear
            )
        })

        k.onHoverEnd('menu_button', (btn) => {
            k.tween(
                btn.scale,
                k.vec2(1),
                0.1,
                (newScale) => btn.scale = newScale,
                k.easings.linear
            )
        })

        k.onUpdate(() => {
            let j = 0;
            for (let i in scores) {
                k.drawText({
                    anchor: 'center',
                    text: j + 1 + '. ' + scores[i][0] + ': ' + scores[i][1],
                    size: 32,
                    font: 'gaegu',
                    pos: k.vec2(scores_container.pos.x, scores_container.pos.y - 224 + j * 34),
                    color: k.rgb(0, 0, 0),
                })
                j += 1;
            }
            updateCamPos(k, scores_container.pos);
            updateCamZoom(k);
        })
    })
}