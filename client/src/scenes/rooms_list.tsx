import { KAPLAYCtx } from "kaplay";

import socket from "src/components/socket";
import { updateCamPos, updateCamZoom } from "src/utils/camUtils";

export default function init_rooms_list(k: KAPLAYCtx) {
    k.scene('rooms_list', () => {
        let room_objs: any[] = [];
        requestRooms();

        k.add([
            k.text('Rooms list', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x, k.center().y - 360),
            k.anchor('center'),
            k.color(0, 0, 0),
        ])

        let error = k.add([
            k.text('', { size: 48, font: 'gaegu' }),
            k.pos(k.center().x, k.center().y + 260),
            k.anchor('center'),
            k.color(0, 0, 0),
        ])

        let rooms_container = k.add([
            k.rect(512, 512, { fill: false }),
            k.pos(k.center().sub(0, 40)),
            k.anchor('center'),
            k.outline(4)
        ])
        k.setCamPos(rooms_container.pos)

        let back = k.add([
            k.text('back', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x - 128, k.center().y + 320),
            k.anchor('center'),
            k.area(),
            k.color(0, 0, 0),
            k.scale(1),
            'menu_button',
        ])

        let refresh = k.add([
            k.text('refresh', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x + 128, k.center().y + 320),
            k.anchor('center'),
            k.area(),
            k.color(0, 0, 0),
            k.scale(1),
            'menu_button',
        ])

        back.onClick(() => {
            k.go('menu');
        })

        socket.emit('get_rooms', (rooms: any) => {
            if (rooms.length === 0) {
            }
        })

        refresh.onClick(() => {
            requestRooms();
        })

        k.onClick('room', (room) => {
            socket.emit('join_room', socket.id, room.room_id, (response: any) => {
                if (response.status === 'room_not_found') {
                    error.text = 'Room "' + room.room_id + '" not found';
                    socket.emit('request_rooms', socket.id);
                } else if (response.status === 'room_full') {
                    error.text = 'Room "' + room.room_id + '" is full';
                    socket.emit('request_rooms', socket.id);
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

        k.onHover('room', (btn) => {
            k.tween(
                btn.scale,
                k.vec2(1.2),
                0.1,
                (newScale) => btn.scale = newScale,
                k.easings.linear
            )
        })

        k.onHoverEnd('room', (btn) => {
            k.tween(
                btn.scale,
                k.vec2(1),
                0.1,
                (newScale) => btn.scale = newScale,
                k.easings.linear
            )
        })

        k.onUpdate(() => {
            updateCamPos(k, rooms_container.pos);
            updateCamZoom(k);
        })

        function requestRooms() {
            socket.emit('request_rooms', socket.id, (response: any) => {
                if (response.status === 'error') {
                    console.log(response.mesage);
                    return
                }

                let rooms = response.rooms;
                for (let i = 0; i < room_objs.length; i++) {
                    room_objs[i].destroy();
                }
                for (let i = 0; i < rooms.length; i++) {
                    let room = rooms[i];
                    if (room.cur_players === room.max_players) {
                        delete rooms[i];
                    }
                }
                if (rooms.length === 0) {
                    error.text = 'No rooms available';
                    refresh.color = k.rgb(255, 0, 0);
                    k.wait(0.5, () => refresh.color = k.rgb(0, 0, 0));
                } else {
                    error.text = '';
                    for (let i = 0; i < rooms.length; i++) {
                        let room = rooms[i];
                        let room_obj = k.add([
                            k.text(room.name + ' (' + room.cur_players + '/' + room.max_players + ')', { size: 48, font: 'gaegu' }),
                            k.anchor('center'),
                            k.pos(rooms_container.pos.x, rooms_container.pos.y - 224 + i * 64),
                            k.area(),
                            k.scale(1),
                            k.color(k.rgb(0, 0, 0)),
                            'room',
                            {
                                room_id: room.room_id,
                            }
                        ])
                        room_objs.push(room_obj);
                    }
                } 
            });
        }
    })
}
