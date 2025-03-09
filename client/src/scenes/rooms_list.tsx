import { KAPLAYCtx } from "kaplay";

import socket from "src/components/socket";
import { updateCamPos, updateCamZoom } from "src/utils/camUtils";

export default function init_rooms_list(k: KAPLAYCtx) {
    k.scene('rooms_list', () => {

        let rooms_list: any = [];

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

        let cancel = k.add([
            k.text('cancel', { size: 64, font: 'gaegu' }),
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

        cancel.onClick(() => {
            k.go('menu');
        })

        socket.emit('get_rooms', (rooms: any) => {
            if (rooms.length === 0) {
            }
        })

        refresh.onClick(() => {
            socket.emit('request_rooms', socket.id);
        })

        socket.off('rooms_list').on('rooms_list', (rooms: any) => {
            if (rooms.length === 0) {
                error.text = 'No rooms available';
                refresh.color = k.rgb(255, 0, 0);
                k.wait(0.5, () => refresh.color = k.rgb(0, 0, 0));
            } else {
                error.text = '';
                for (let i = 0; i < rooms.length; i++) {
                    let room = rooms[i];
                    if (!rooms_list.includes(room)) {
                        rooms_list.push(room);
                    };
                }
            } 
            console.log(rooms_list)
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
            for (let i = 0; i < rooms_list.length; i++) {
                let room = rooms_list[i];
                console.log(room)
                k.drawText({
                    text: room.name + ' (' + room.cur_players + '/' + room.max_players + ')',
                    anchor: 'center',
                    size: 48,
                    font: 'gaegu',
                    pos: k.vec2(k.center().x, k.center().y - 256 + i * 64),
                    color: k.rgb(0, 0, 0),
                })
            }
            updateCamPos(k, rooms_container.pos);
            updateCamZoom(k);
        })
    })
}