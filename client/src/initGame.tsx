import makeKaplayCtx from "./kaplayCtx";
import init_menu from "./scenes/menu";

import io from 'socket.io-client';
const socket = io("http://localhost:2001");

export default async function initGame() {
    const k = makeKaplayCtx();

    // load font
    k.loadFont('gaegu', './fonts/Gaegu-Regular.ttf')

    // load letters
    for (let i = 0; i < 26; i++)
        k.loadSprite(`${String.fromCharCode(97 + i)}`, `./letters/${String.fromCharCode(65 + i)}.png`)

	
    // scenes
    init_menu(k)

    let data = {socket: socket}
	k.go('menu', data)
}