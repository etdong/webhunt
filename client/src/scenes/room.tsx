import { GameObj, KAPLAYCtx } from "kaplay";
import { updateCamPos, updateCamZoom } from "src/utils/camUtils";

import socket from "src/components/socket";

/**
 * Initializes the room/lobby screen
 * @param k KAPLAY context
 */
export default function init_room(k: KAPLAYCtx) {
    k.scene('room', () => {

        // declarations
        let player_names: string[] = [];
        let ready_states: boolean[] = [];

        // draw components
        // create background an recenter camera
        let background = k.add([
            k.rect(k.width(), k.height()),
            k.anchor('center'),
            k.pos(k.center()),
        ])
        updateCamPos(k, background.pos);
        updateCamZoom(k);

        // drawing the room components
        let elements = draw_room(k);
        let room_name = elements[0];
        let max_players = elements[1];
        let round_time = elements[2];
        let board_size = elements[3];
        let room_id = elements[4];
        let lobby = elements[5];
        let leave = elements[6];
        let start = elements[7];
        let ready = elements[8];

        // button click events
        leave.onClick(() => {
            socket.emit('leave_room', socket.id, room_id.text);
            k.go('menu');
        })

        ready.onClick(() => {
            socket.emit('signal_ready', socket.id, room_id.text);
            ready.ready = !ready.ready;
            if (ready.ready) {
                ready.color = k.rgb(0, 125, 0);
            } else {
                ready.color = k.rgb(255, 0, 0);
            }
        })

        start.onClick(() => {
            socket.emit('signal_ready', socket.id, room_id.text);
            socket.emit('signal_start', room_id.text);
        })

        // socket game start event
        socket.off('game_start').on('game_start', (board: any, round_time) => {
            k.go('game', { 
                board: board, 
                round_time: round_time,
                room_id: room_id.text,
            });
        })

        // receive room info from server
        socket.off('room_info').on('room_info', (room: any, isOwner: boolean) => {
            room_name.text = room.name;
            player_names = room.players.names;
            ready_states = room.players.ready_states;
            max_players.text = room.max_players;
            round_time.text = room.round_time + 's';
            board_size.text = room.board_size + 'x' + room.board_size;
            room_id.text = room.id;
            if (isOwner) {
                start.area.scale = k.vec2(1)
                start.hidden = false;
                ready.area.scale = k.vec2(0);
                ready.hidden = true;
            } else {
                start.area.scale = k.vec2(0);
                start.hidden = true;
                ready.area.scale = k.vec2(1);
                ready.hidden = false;
            }
        })

        // button hover animation
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

        // draw player names and ready states
        k.onDraw(() => {
            for (let i = 0; i < player_names.length; i++) {
                let name = player_names[i];
                if (name.length > 16) {
                    name = name.slice(0, 16) + '...';
                }
                k.drawText({
                    anchor: 'left',
                    text: i + 1 + '. ' + name,
                    size: 32,
                    font: 'gaegu',
                    pos: k.vec2(lobby.pos.x - lobby.width/2 + 32, lobby.pos.y - 256 + i * 34),
                    color: k.rgb(0, 0, 0),
                })

                k.drawText({
                    anchor: 'right',
                    text: ready_states[i] ? 'ready' : '',
                    size: 32,
                    font: 'gaegu',
                    pos: k.vec2(lobby.pos.x + lobby.width/2 - 32, lobby.pos.y - 256 + i * 34),
                    color: k.rgb(0, 0, 0),
                })
            }
        })

        // constantly update camera position and zoom
        k.onUpdate(() => {
            updateCamPos(k, background.pos);
            updateCamZoom(k);
        })
    })
}

/**
 * Draws the room screen differntly based on the window size
 * @param k KAPLAY context
 * @returns The elements of the room screen
 */
function draw_room(k: KAPLAYCtx) {
    // desktop layout
    let base_pos = k.center()
    let x_offset = 0
    let y_offset = 0;
    let lobby_pos = k.center()
    let buttons_pos = k.center().add(-192, 256)
    console.log(k.getCamScale().x)

    if (k.getCamScale().x !== 1) {
        // mobile/vertical layout
        x_offset = -160
        y_offset = 160
        lobby_pos = k.center().add(-282, 128)
        buttons_pos = base_pos.add(0, 512)
    }
    
    // labels
    k.add([
        k.text('max. players:', { size: 48, font: 'gaegu' }),
        k.pos(base_pos.x - x_offset - 128, base_pos.y - y_offset - 256),
        k.anchor('right'),
        k.color(0, 0, 0),
    ])

    k.add([
        k.text('round time:', { size: 48, font: 'gaegu' }),
        k.pos(base_pos.x - x_offset - 128, base_pos.y - y_offset - 192),
        k.anchor('right'),
        k.color(0, 0, 0),
    ])

    k.add([
        k.text('board size:', { size: 48, font: 'gaegu' }),
        k.pos(base_pos.x - x_offset - 128, base_pos.y - y_offset - 128),
        k.anchor('right'),
        k.color(0, 0, 0),
    ])

    k.add([
        k.text('room id:', { size: 48, font: 'gaegu' }),
        k.pos(base_pos.x - x_offset - 128, base_pos.y - y_offset - 64),
        k.anchor('right'),
        k.color(0, 0, 0),
    ])

    // info fields
    let room_name = k.add([
        k.text('...', { size: 64, font: 'gaegu' }),
        k.pos(base_pos.x, base_pos.y - y_offset - 360),
        k.anchor('center'),
        k.color(0, 0, 0),
    ])

    let max_players = k.add([
        k.text('...', { size: 48, font: 'gaegu' }),
        k.pos(base_pos.x - x_offset - 32, base_pos.y - y_offset - 256),
        k.anchor('right'),
        k.color(0, 0, 0),
    ])

    let round_time = k.add([
        k.text('...', { size: 48, font: 'gaegu' }),
        k.pos(base_pos.x - x_offset - 32, base_pos.y - y_offset - 192),
        k.anchor('right'),
        k.color(0, 0, 0),
    ])

    let board_size = k.add([
        k.text('...', { size: 48, font: 'gaegu' }),
        k.pos(base_pos.x - x_offset - 32, base_pos.y - y_offset - 128),
        k.anchor('right'),
        k.color(0, 0, 0),
    ])

    let room_id = k.add([
        k.text('...', { size: 40 }),
        k.pos(base_pos.x - x_offset - 48, base_pos.y - y_offset - 64),
        k.anchor('center'),
        k.color(0, 0, 0),
    ])

    let lobby = k.add([
        k.rect(500, 600, { fill: false }),
        k.pos(lobby_pos.add(282, 0)),
        k.anchor('center'),
        k.outline(4)
    ])

    // buttons
    let leave = k.add([
        k.text('leave', { size: 64, font: 'gaegu' }),
        k.pos(buttons_pos.add(-96, 0)),
        k.anchor('center'),
        k.area(),
        k.color(0, 0, 0),
        k.scale(1),
        'menu_button',
    ])

    // start/ready buttons start hidden and are shown based on the player's role
    // owner can start the game, other players can signal that they are ready
    let start = k.add([
        k.text('start', { size: 64, font: 'gaegu' }),
        k.pos(buttons_pos.add(96, 0)),
        k.anchor('center'),
        k.area({ scale: 0 }),
        k.color(0, 0, 0),
        k.scale(1),
        'menu_button',
    ])
    start.hidden = true;

    let ready = k.add([
        k.text('ready', { size: 64, font: 'gaegu' }),
        k.pos(buttons_pos.add(96, 0)),
        k.anchor('center'),
        k.area({ scale: 0 }),
        k.color(255, 0, 0),
        k.scale(1),
        'menu_button',
        {
            ready: false,
        }
    ])
    ready.hidden = true;

    let elements: GameObj[] = [room_name, max_players, round_time, board_size, room_id, lobby, leave, start, ready]
    return elements
}