import { KAPLAYCtx } from "kaplay";

import socket from "src/components/socket";
import { updateCamPos, updateCamZoom } from "src/utils/camUtils";

export default function init_room(k: KAPLAYCtx) {
    k.scene('room', () => {
        let player_names: string[] = [];

        draw_labels(k);

        let room_name = k.add([
            k.text('', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x, k.center().y - 360),
            k.anchor('center'),
            k.color(0, 0, 0),
        ])

        let max_players = k.add([
            k.text('', { size: 48, font: 'gaegu' }),
            k.pos(k.center().x - 32, k.center().y - 256),
            k.anchor('right'),
            k.color(0, 0, 0),
        ])

        let round_time = k.add([
            k.text('', { size: 48, font: 'gaegu' }),
            k.pos(k.center().x - 32, k.center().y - 192),
            k.anchor('right'),
            k.color(0, 0, 0),
        ])

        let board_size = k.add([
            k.text('', { size: 48, font: 'gaegu' }),
            k.pos(k.center().x - 32, k.center().y - 128),
            k.anchor('right'),
            k.color(0, 0, 0),
        ])

        let room_id = k.add([
            k.text('', { size: 48, font: 'gaegu' }),
            k.pos(k.center().x - 32, k.center().y + 160),
            k.anchor('right'),
            k.color(0, 0, 0),
        ])

        let lobby = k.add([
            k.rect(512, 600, { fill: false }),
            k.pos(k.center().add(32, 0)),
            k.anchor('left'),
            k.outline(4)
        ])

        k.setCamPos(lobby.pos);

        let leave = k.add([
            k.text('leave', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x - 320, k.center().y + 256),
            k.anchor('center'),
            k.area(),
            k.color(0, 0, 0),
            k.scale(1),
            'menu_button',
        ])

        let start = k.add([
            k.text('start', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x - 32, k.center().y + 256),
            k.anchor('right'),
            k.area(),
            k.color(0, 0, 0),
            k.scale(1),
            'menu_button',
        ])

        leave.onClick(() => {
            socket.emit('leave_room', socket.id, room_id.text);
            k.go('menu');
        })

        socket.on('room_info', (room: any, isOwner: boolean) => {
            room_name.text = room.name;
            player_names = room.player_names;
            max_players.text = room.max_players;
            round_time.text = room.round_time + 's';
            board_size.text = room.board_size + 'x' + room.board_size;
            room_id.text = room.id;
            if (isOwner)
                start.hidden = false;
            else
                start.hidden = true;
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
            for (let i = 0; i < player_names.length; i++) {
                k.drawText({
                    anchor: 'left',
                    text: i + 1 + '. ' + player_names[i],
                    size: 32,
                    font: 'gaegu',
                    pos: k.vec2(lobby.pos.x + 32, lobby.pos.y - 256 + i * 34),
                    color: k.rgb(0, 0, 0),
                })
            }

            updateCamPos(k, lobby.pos);
            updateCamZoom(k);
        })
    })
}

function draw_labels(k: KAPLAYCtx) {
    k.add([
        k.text('max. players:', { size: 48, font: 'gaegu' }),
        k.pos(k.center().x - 148, k.center().y - 256),
        k.anchor('right'),
        k.color(0, 0, 0),
    ])

    k.add([
        k.text('round time:', { size: 48, font: 'gaegu' }),
        k.pos(k.center().x - 148, k.center().y - 192),
        k.anchor('right'),
        k.color(0, 0, 0),
    ])

    k.add([
        k.text('board size:', { size: 48, font: 'gaegu' }),
        k.pos(k.center().x - 148, k.center().y - 128),
        k.anchor('right'),
        k.color(0, 0, 0),
    ])

    k.add([
        k.text('room id:', { size: 48, font: 'gaegu' }),
        k.pos(k.center().x - 148, k.center().y + 160),
        k.anchor('right'),
        k.color(0, 0, 0),
    ])
}