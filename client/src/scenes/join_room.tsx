import { KAPLAYCtx } from "kaplay";

import socket from "src/components/socket";
import { updateCamPos, updateCamZoom } from "src/utils/camUtils";

export default function init_join_room(k: KAPLAYCtx) {
    k.scene('join_room', () => {
        let background = k.add([
            k.rect(k.width(), k.height()),
            k.area(),
            k.anchor('center'),
            k.pos(k.center()),
        ])

        k.add([
            k.text('Join a room', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x, k.center().y - 256),
            k.anchor('center'),
            k.color(0, 0, 0),
        ])

        let error = k.add([
            k.text('', { size: 48, font: 'gaegu' }),
            k.pos(k.center().x, k.center().y + 128),
            k.anchor('center'),
            k.color(0, 0, 0),
        ])

        let cancel = k.add([
            k.text('cancel', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x - 128, k.center().y + 256),
            k.anchor('center'),
            k.area(),
            k.color(0, 0, 0),
            k.scale(1),
            'menu_button',
        ])

        let join = k.add([
            k.text('join', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x + 128, k.center().y + 256),
            k.anchor('center'),
            k.area(),
            k.color(0, 0, 0),
            k.scale(1),
            'menu_button',
        ])

        const fields = init_fields(k);

        cancel.onClick(() => {
            k.go('menu');
        })

        join.onClick(() => {
            let room_id = fields[0].text;
            if (room_id.length !== 4) {
                error.text = 'Room ID must be 4 characters long';
                join.color = k.rgb(255, 0, 0);
                k.wait(0.5, () => join.color = k.rgb(0, 0, 0));
                return;
            }
            socket.emit('join_room', socket.id, room_id, (response: any) => {
                if (response.status === 'room_not_found') {
                    error.text = 'Room "' + room_id + '" not found';
                    join.color = k.rgb(255, 0, 0);
                    k.wait(0.5, () => join.color = k.rgb(0, 0, 0));
                } else if (response.status === 'room_full') {
                    error.text = 'Room "' + room_id + '" is full';
                    join.color = k.rgb(255, 0, 0);
                    k.wait(0.5, () => join.color = k.rgb(0, 0, 0));
                } else {
                    k.go('room');
                }
            });
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
            updateCamPos(k, background.pos);
            updateCamZoom(k);
        })
    })
}

function init_fields(k: KAPLAYCtx) {
    let fields = [];
    k.add([
        k.text('Room ID:', { size: 48, font: 'gaegu' }),
        k.pos(k.center().x, k.center().y - 64),
        k.anchor('center'),
        k.color(0, 0, 0),
    ])

    k.add([
        k.rect(256, 64, { fill: false }),
        k.pos(k.center().x, k.center().y + 16),
        k.anchor('center'),
        k.outline(4),
    ])

    let input = k.add([
        k.text('', { size: 48, font: 'gaegu' }),
        k.textInput(true, 4),
        k.pos(k.center().x, k.center().y + 16),
        k.anchor('center'),
        k.color(0, 0, 0),
        'input',
        k.area(),
    ])
    fields.push(input);

    return fields;
}