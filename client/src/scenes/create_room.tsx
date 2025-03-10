import { KAPLAYCtx } from "kaplay";
import { updateCamPos, updateCamZoom } from "../utils/camUtils";

import socket from "src/components/socket";

export default function init_create_room(k: KAPLAYCtx) {
    k.scene('create_room', () => {

        let background = k.add([
            k.rect(k.width(), k.height()),
            k.area(),
            k.anchor('center'),
            k.pos(k.center()),
        ])

        k.add([
            k.text('Create a room', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x, k.center().y - 360),
            k.anchor('center'),
            k.color(0, 0, 0),
        ])

        let cancel = k.add([
            k.text('cancel', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x - 128, k.center().y + 320),
            k.anchor('center'),
            k.area(),
            k.color(0, 0, 0),
            k.scale(1),
            'menu_button',
        ])

        let create = k.add([
            k.text('create', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x + 128, k.center().y + 320),
            k.anchor('center'),
            k.area(),
            k.color(0, 0, 0),
            k.scale(1),
            'menu_button',
        ])

        const fields = init_fields(k);
        
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

        cancel.onClick(() => {
            k.go('menu');
        })

        create.onClick(() => {
            let room_info = {
                name: fields[0].text,
                max_players: parseInt(fields[1].text),
                round_time: parseInt(fields[2].text.split('s')[0]),
                board_size: parseInt(fields[3].text.split('x')[0]),
            }

            socket.emit('create_room', socket.id, room_info, (response: any) => {
                if (response.status === 'ok') {
                    k.go('room');
                } else {
                    console.log(response.message);
                }
            })
        })

        k.onUpdate(() => {
            updateCamPos(k, background.pos);
            updateCamZoom(k);
        })
    });
}

const init_fields = (k: KAPLAYCtx) => {
    // name field
    const inputRect = new k.Rect(k.vec2(0), 24*16, 68)
    k.add([
        k.text('name:', { size: 48, font: 'gaegu' }),
        k.pos(k.center().x, k.center().y - 280),
        k.anchor('center'),
        k.color(0, 0, 0),
    ])

    let name_pos = k.vec2(k.center().x, k.center().y - 210);
    let name_input = k.add([
        k.text('', { size: 64, font: 'gaegu' }),
        k.area({ shape: inputRect }),
        k.textInput(true, 10),
        k.pos(name_pos),
        k.anchor('center'),
        k.color(0, 0, 0),
        k.scale(1),
    ]);

    k.add([
        k.rect(inputRect.width, inputRect.height, {fill: false}),
        k.pos(name_pos),
        k.outline(4, k.rgb(0, 0, 0)),
        k.anchor('center'),
    ])

    // max players field
    const max_players_pos = k.vec2(k.center().x - 64, k.center().y - 100);
    k.add([
        k.text('max. players:', { size: 48, font: 'gaegu' }),
        k.pos(max_players_pos),
        k.anchor('center'),
        k.color(0, 0, 0),
    ])

    k.add([
        k.polygon([
            k.vec2(0, 0),
            k.vec2(32, -24),
            k.vec2(64, 0),
            ], { fill: false }),
        k.pos(k.center().x + 128, max_players_pos.y - 28),
        k.anchor('center'),
        k.area(),
        k.color(0, 0, 0),
        k.outline(4),
        'players_up',   
    ])

    k.add([
        k.polygon([
            k.vec2(0, 0),
            k.vec2(32, 24),
            k.vec2(64, 0),
            ], { fill: false }),
        k.pos(k.center().x + 128, max_players_pos.y + 28),
        k.anchor('center'),
        k.area(),
        k.color(0, 0, 0),
        k.outline(4),
        'players_down',
    ])

    let player_count = k.add([
        k.text('2', { size: 48, font: 'gaegu' }),
        k.pos(k.center().x + 160, max_players_pos.y),
        k.anchor('center'),
        k.color(0, 0, 0),
    ])


    // time / round field
    const total_time_pos = k.vec2(k.center().x - 64, k.center().y + 32);
    k.add([
        k.text('time / round:', { size: 48, font: 'gaegu' }),
        k.pos(total_time_pos),
        k.anchor('center'),
        k.color(0, 0, 0),
    ])
    
    k.add([
        k.polygon([
            k.vec2(0, 0),
            k.vec2(32, -24),
            k.vec2(64, 0),
            ], { fill: false }),
        k.pos(k.center().x + 128, total_time_pos.y - 28),
        k.anchor('center'),
        k.area(),
        k.color(0, 0, 0),
        k.outline(4),
        'time_up',   
    ])

    k.add([
        k.polygon([
            k.vec2(0, 0),
            k.vec2(32, 24),
            k.vec2(64, 0),
            ], { fill: false }),
        k.pos(k.center().x + 128, total_time_pos.y + 28),
        k.anchor('center'),
        k.area(),
        k.color(0, 0, 0),
        k.outline(4),
        'time_down',
    ])

    let total_time = k.add([
        k.text('60s', { size: 48, font: 'gaegu' }),
        k.pos(k.center().x + 160, total_time_pos.y),
        k.anchor('center'),
        k.color(0, 0, 0),
    ])

    // board size field
    const board_size_pos = k.vec2(k.center().x - 64, k.center().y + 164);
    k.add([
        k.text('board size:', { size: 48, font: 'gaegu' }),
        k.pos(board_size_pos),
        k.anchor('center'),
        k.color(0, 0, 0),
    ])

    k.add([
        k.polygon([
            k.vec2(0, 0),
            k.vec2(32, -24),
            k.vec2(64, 0),
            ], { fill: false }),
        k.pos(k.center().x + 128, board_size_pos.y - 28),
        k.anchor('center'),
        k.area(),
        k.color(0, 0, 0),
        k.outline(4),
        'board_up',   
    ])

    k.add([
        k.polygon([
            k.vec2(0, 0),
            k.vec2(32, 24),
            k.vec2(64, 0),
            ], { fill: false }),
        k.pos(k.center().x + 128, board_size_pos.y + 28),
        k.anchor('center'),
        k.area(),
        k.color(0, 0, 0),
        k.outline(4),
        'board_down',
    ])

    let board_size = k.add([
        k.text('4x4', { size: 48, font: 'gaegu' }),
        k.pos(k.center().x + 160, board_size_pos.y),
        k.anchor('center'),
        k.color(0, 0, 0),
    ])

    name_input.onClick(() => {
        let text = prompt('enter a room name: ');
        if (text === null) return;
        name_input.text = text;
    })

    k.onClick('players_up', () => {
        let count = parseInt(player_count.text);
        if (count < 16) count++;
        player_count.text = count.toString();
    })

    k.onClick('players_down', () => {
        let count = parseInt(player_count.text);
        if (count > 2) count-- 
        player_count.text = count.toString();
    })

    k.onClick('time_up', () => {
        let time = parseInt(total_time.text);
        if (time < 120) time += 10;
        let time_string = time.toString() + 's';
        total_time.text = time_string;
    })

    k.onClick('time_down', () => {
        let time = parseInt(total_time.text);
        if (time > 10) time -= 10;
        let time_string = time.toString() + 's';
        total_time.text = time_string;
    })

    k.onClick('board_up', () => {
        let size = parseInt(board_size.text.split('x')[0]);
        if (size < 9) size++;
        let size_string = size.toString() + 'x' + size.toString();
        board_size.text = size_string;
    })

    k.onClick('board_down', () => {
        let size = parseInt(board_size.text.split('x')[0]);
        if (size > 3) size--;
        let size_string = size.toString() + 'x' + size.toString();
        board_size.text = size_string;
    })

    return ([name_input, player_count, total_time, board_size]);
}