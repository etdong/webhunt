import { GameObj, KAPLAYCtx } from "kaplay";
import debug_Players from "../utils/debug";
import { getRelativeMousePos, updateCamPos, updateCamZoom } from "../utils/camUtils";

import socket from "src/components/socket";

export default function init_menu(k: KAPLAYCtx) {
    k.scene('menu', () => {

        // declarations
        let title = 'WEBHUNT';
        let clicked: any = null;
        let letters: GameObj[] = [];

        // draw components
        debug_Players(k, socket);

        let background = k.add([
            k.rect(k.width(), k.height()),
            k.area(),
            k.anchor('center'),
            k.pos(k.center()),
        ])

        let menu_buttons = ['rooms list', 'create a room', 'join by code'];

        for (let i = 0; i < menu_buttons.length; i++) {
            k.add([
                k.text(menu_buttons[i], { size: 64, font: 'gaegu' }),
                k.pos(k.width() / 2, k.height() / 2 + i * 128),
                k.anchor('center'),
                k.area(),
                k.color(0, 0, 0),
                k.scale(1),
                'menu_button',
                'button_' + i,
            ]);
        }


        for (let i = 0; i < title.length; i++) {
            let letter = k.add([
                k.anchor('center'),
                k.sprite(title.charAt(i)),
                k.area({ shape: new k.Polygon([
                    k.vec2(118, 118),
                    k.vec2(128, 100),
                    k.vec2(128, -100),
                    k.vec2(118, -118),
                    k.vec2(100, -128),
                    k.vec2(-100, -128),
                    k.vec2(-118, -118),
                    k.vec2(-128, -100),
                    k.vec2(-128, 100),
                    k.vec2(-118, 118),
                    k.vec2(-100, 128),
                ])}),
                k.body(),
                k.pos(k.width() / 2 - title.length/2 * 128 + i * 164, k.center().y - 256),
                k.scale(0.5),
                k.offscreen({
                    hide: true,
                    distance: 64,
                }),
                'letter',
                title.charAt(i),
            ]);

            letters.push(letter);
        }
        
        
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

        k.onUpdate(() => {
            updateCamPos(k, background.pos);
            updateCamZoom(k);
            for (let i in letters) {
                if (letters[i].hidden) {
                    letters[i].pos = k.center().sub(k.rand(-100, 100), k.rand(-100, 100));
                }
            }
        })
    });
}