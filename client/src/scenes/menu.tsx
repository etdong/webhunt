import { GameObj, KAPLAYCtx } from "kaplay";
import drawPlayers from "../utils/drawPlayers";
import { updateCamPos, updateCamZoom } from "../utils/updateCam";

export default function init_menu(k: KAPLAYCtx) {
    k.scene('menu', (data) => {
        let socket = data.socket;
        
        drawPlayers(k, socket);

        let title = 'webhunt';
        let clicked: any = null;
        let letters: GameObj[] = [];

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
                k.pos(k.width() / 2 - title.length/2 * 128 + i * 164, k.center().y),
                k.scale(0.5),
                k.offscreen({
                    hide: true,
                    distance: 64,
                }),
                'letter',
                title.charAt(i),
            ]);

            letters.push(letter);

            letter.onHover(() => {
                k.tween(
                    letter.scale,
                    k.vec2(0.55),
                    0.1,
                    (newScale) => letter.scale = newScale,
                    k.easings.linear
                )
                console.log('hovered ' + letter.tags)
            })

            // eslint-disable-next-line no-loop-func
            letter.onClick(() => {
                clicked = letter;
            })
        }

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
                    k.mousePos(),
                    0.1,
                    (newPos) => clicked.pos = newPos,
                    k.easings.easeOutQuad
                )
            }
        })


        k.onMouseRelease("left", () => {
            console.log('released')
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
            updateCamPos(k, k.center());
            updateCamZoom(k);
            for (let i in letters) {
                if (letters[i].hidden) {
                    letters[i].pos = k.center().sub(k.rand(-100, 100), k.rand(-100, 100));
                }
            }
        })
    });
}