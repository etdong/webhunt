import { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { getRelativeMousePos, updateCamPos, updateCamZoom } from "../utils/camUtils";

import socket from "src/components/socket";

export default function init_menu(k: KAPLAYCtx) {
    k.scene('menu', () => {

        // declarations
        let clicked: any = null;
        let loggedIn = false;

        // draw components
        let background = k.add([
            k.rect(k.width(), k.height()),
            k.area(),
            k.scale(2),
            k.anchor('center'),
            k.pos(k.center()),
        ])

        updateCamPos(k, background.pos);
        updateCamZoom(k);

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


        let letters = draw_title(k);
        

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
        
        k.onDraw(() => {
            for (let i in letters) {
                k.drawText({
                    text: letters[i].tags[2],
                    anchor: 'center',
                    pos: letters[i].pos,
                    size: 64,
                    scale: letters[i].scale.x * 2,
                    font: 'gaegu',
                    color: k.rgb(0, 0, 0),
                });
            }
        })

        socket.on('logged_in', () => loggedIn = true);

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

function draw_title(k: KAPLAYCtx) {
    let letters: GameObj[] = [];
    let title = "WEBHUNT"
    let polygon = [k.vec2(118, 118),
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
        k.vec2(100, 128)];
    if (k.getCamScale().x !== 1) {
        for (let i = 0; i < 3; i++) {
            let letter = k.add([
                k.anchor('center'),
                k.polygon(polygon, {fill: true}),
                k.outline(6),
                k.area(),
                k.body(),
                k.pos(k.center().x - 3/2 * 128 + 64 + i * 128, k.center().y - 384),
                k.scale(0.5),
                k.color(k.rgb(255, 224, 170)),
                k.offscreen({
                    hide: true,
                    distance: 64,
                }),
                'letter',
                title.charAt(i),
            ]);
            letters.push(letter);
        }

        for (let i = 3; i < title.length; i++) {
            let letter = k.add([
                k.anchor('center'),
                k.polygon(polygon, {fill: true}),
                k.outline(6),
                k.area(),
                k.body(),
                k.pos(k.center().x - 2 * 128 + 64 + (i-3) * 128, k.center().y - 256),
                k.scale(0.5),
                k.color(k.rgb(255, 224, 170)),
                k.offscreen({
                    hide: true,
                    distance: 64,
                }),
                'letter',
                title.charAt(i),
            ]);
            letters.push(letter);
        }
        return letters;
    } else {
        for (let i = 0; i < title.length; i++) {
            let letter = k.add([
                k.anchor('center'),
                k.polygon(polygon, {fill: true}),
                k.outline(6),
                k.area(),
                k.body(),
                k.pos(k.center().x - title.length/2 * 128 + 64 + i * 128, k.center().y - 256),
                k.scale(0.5),
                k.color(k.rgb(255, 224, 170)),
                k.offscreen({
                    hide: true,
                    distance: 64,
                }),
                'letter',
                title.charAt(i),
            ]);
    
            letters.push(letter);
        }
    }
    
    return letters;
}