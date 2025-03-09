import { KAPLAYCtx } from "kaplay";
import { getRelativeMousePos, updateCamPos, updateCamZoom } from "../utils/camUtils";

import socket from "src/components/socket";
import { draw_with_tiles } from "src/utils/drawUtils";

export default function init_menu(k: KAPLAYCtx) {
    k.scene('menu', () => {

        // declarations
        let title = 'WEBHUNT';
        let clicked: any = null;
        let loggedIn = false;

        socket.on('logged_in', () => loggedIn = true);
        socket.emit('check_login', socket.id, (response: any) => {
            loggedIn = response;
        })

        // draw components
        let background = k.add([
            k.rect(k.width(), k.height()),
            k.area(),
            k.anchor('center'),
            k.pos(k.center()),
        ])

        let menu_labels = ['rooms list', 'create a room', 'join by code', 'stats'];
        let menu_buttons: any[] = [];

        for (let i = 0; i < menu_labels.length; i++) {
            let button = k.add([
                k.text(menu_labels[i], { size: 64, font: 'gaegu' }),
                k.pos(k.width() / 2, k.height() / 2 + i * 128),
                k.anchor('center'),
                k.area(),
                k.color(0, 0, 0),
                k.scale(1),
                'menu_button',
                'button_' + i,
            ]);
            menu_buttons.push(button);
        }


        let letters = draw_with_tiles(k, title);
        

        // event handlers
        k.onClick('', (object) => {
            if (object.tags.includes('letter')) {
                clicked = object;
            } else {
                clicked = null;
            }
        })

        k.onClick('menu_button', (btn) => {
            if (btn.text === 'rooms list') {
                k.go('rooms_list');
            } else if (btn.text === 'create a room') {
                k.go('create_room');
            } else if (btn.text === 'join by code') {
                k.go('join_room');
            } else if (btn.text === 'stats') {
                k.go('stats');
            }
        })

        k.onHover('letter', (letter) => {
            k.tween(
                letter.scale,
                k.vec2(0.55),
                0.1,
                (newScale) => letter.scale = newScale,
                k.easings.linear
            )
        })


        k.onHoverEnd('letter', (letter) => {
            k.tween(
                letter.scale,
                k.vec2(0.5),
                0.1,
                (newScale) => letter.scale = newScale,
                k.easings.linear
            )
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

        k.onMouseDown("left", () => {
            if (clicked !== null) {
                k.tween(
                    clicked.scale,
                    k.vec2(0.6),
                    0.1,
                    (newScale) => clicked.scale = newScale,
                    k.easings.linear
                )
                k.tween(
                    clicked.pos,
                    getRelativeMousePos(k),
                    0.1,
                    (newPos) => clicked.pos = newPos,
                    k.easings.easeOutQuad
                )
            }
        })

        k.onMouseRelease("left", () => {
            if (clicked !== null) {
                k.tween(
                    clicked.scale,
                    k.vec2(0.5),
                    0.1,
                    (newScale) => clicked.scale = newScale,
                    k.easings.linear
                )
            }
        })

        socket.on('logged_out', () => {
            loggedIn = false;
        })

        k.onUpdate(() => {
            if (!loggedIn) {
                menu_buttons[3].text = 'log in to see stats'
                menu_buttons[3].color = k.rgb(128, 128, 128);
            } else {
                menu_buttons[3].text = 'stats';
                menu_buttons[3].color = k.rgb(0, 0, 0);
            }
            updateCamPos(k, background.pos);
            updateCamZoom(k);
            for (let i in letters) {
                if (letters[i].hidden) {
                    letters[i].pos = k.center().sub(k.rand(-100, 100), 300 + k.rand(-100, 100));
                }
            }
        })
    });
}