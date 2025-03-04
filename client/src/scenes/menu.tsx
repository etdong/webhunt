import { GameObj, KAPLAYCtx } from "kaplay";
import debug_Players from "../utils/debug";
import { getRelativeMousePos, updateCamPos, updateCamZoom } from "../utils/camUtils";

export default function init_menu(k: KAPLAYCtx) {
    k.scene('menu', (data) => {

        // declarations
        let socket = data.socket;
        let title = 'WEBHUNT';
        let clicked: any = null;
        let letters: GameObj[] = [];

        // draw components
        debug_Players(k, socket);

        let start_button = k.add([
            k.text('start', { size: 64, font: 'gaegu' }),
            k.pos(k.center()),
            k.color(0, 0, 0),
            k.anchor('center'),
            k.area(),
            k.scale(1),
            'start_button'
        ])

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

            // need to set the most recent clicked, otherwise you can
            // accidentally hover another letter and switch targets
            // eslint-disable-next-line no-loop-func
            letter.onClick(() => {
                clicked = letter;
            })
        }


        // socket handling
        // when a client returns to the menu from game, the game will emit an 'end' event
        if (data.state === 'end') {
            socket.emit('end');
        }

        // received start from server
        socket.on('enter_lobby', () => {
            k.go('game', { socket: socket });
        })

        // 'final_scores' gets emitted after 'end' is received by the server
        socket.on('final_scores', (data: any) => {
            let j = 0
            for (let i in data) {
                k.add([
                    k.text(data[i], { size: 32 }),
                    k.pos(0, 35 + 80 * j),
                    k.color(255, 0, 255),
                ]);
                j += 1;
            }
        })
        
        
        // event handlers
        start_button.onHover(() => {
            start_button.scale = k.vec2(1.4);
        })

        start_button.onHoverEnd(() => {
            start_button.scale = k.vec2(1);
        })

        start_button.onClick(() => {
            k.go('game', { socket: socket });
            socket.emit('signal_start', 4)
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
            updateCamPos(k, start_button.pos);
            updateCamZoom(k);
            for (let i in letters) {
                if (letters[i].hidden) {
                    letters[i].pos = k.center().sub(k.rand(-100, 100), k.rand(-100, 100));
                }
            }
        })
    });
}