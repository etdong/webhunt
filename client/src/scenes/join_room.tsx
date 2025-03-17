import { KAPLAYCtx } from "kaplay";
import { updateCamPos, updateCamZoom } from "src/utils/camUtils";

import socket from "src/components/socket";

/**
 * Initializes the room joining screen
 * @param k KAPLAY context
 */
export default function init_join_room(k: KAPLAYCtx) {
    k.scene('join_room', () => {

        // create background an recenter camera
        let background = k.add([
            k.rect(k.width(), k.height()),
            k.anchor('center'),
            k.pos(k.center()),
        ])
        updateCamPos(k, background.pos);
        updateCamZoom(k);

        // component drawing
        // screen title
        k.add([
            k.text('Join a room', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x, k.center().y - 256),
            k.anchor('center'),
            k.color(0, 0, 0),
        ])

        // error text
        let error = k.add([
            k.text('', { size: 48, font: 'gaegu' }),
            k.pos(k.center().x, k.center().y + 128),
            k.anchor('center'),
            k.color(0, 0, 0),
        ])

        // cancel button
        let cancel = k.add([
            k.text('cancel', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x - 128, k.center().y + 256),
            k.anchor('center'),
            k.area(),
            k.color(0, 0, 0),
            k.scale(1),
            'menu_button',
        ])

        // join button
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

        // menu button click events
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

        // button hover animations
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

        // constantly update camera position and zoom
        k.onUpdate(() => {
            updateCamPos(k, background.pos);
            updateCamZoom(k);
        })
    })
}

/**
 * Creates the input fields for the join room scene
 * @param k KAPLAY context
 * @returns Array of initialized input fields
 */
function init_fields(k: KAPLAYCtx) {
    let fields = [];

    // room id label
    k.add([
        k.text('Room ID:', { size: 48, font: 'gaegu' }),
        k.pos(k.center().x, k.center().y - 64),
        k.anchor('center'),
        k.color(0, 0, 0),
    ])

    // id input box
    let input = k.add([
        k.text('', { size: 48, font: 'gaegu' }),
        k.textInput(true, 4),
        k.pos(k.center().x, k.center().y + 16),
        k.anchor('center'),
        k.color(0, 0, 0),
        'input',
        k.area({ shape: new k.Rect(k.vec2(0, 0), 256, 64) }),
    ])

    // id input box bounding box
    k.add([
        k.rect(256, 64, { fill: false }),
        k.pos(k.center().x, k.center().y + 16),
        k.anchor('center'),
        k.outline(4),
    ])

    // id input box calls to a prompt
    // the id field auto focuses on desktop, so this is mostly for mobile users
    input.onClick(() => {
        let text = prompt('enter a room id: ');
        if (text === null) return;
        input.text = text;
    })

    fields.push(input);

    return fields;
}