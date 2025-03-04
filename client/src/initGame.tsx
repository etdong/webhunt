import makeKaplayCtx from "./kaplayCtx";
import init_game from "./scenes/game";
import init_menu from "./scenes/menu";

import io from 'socket.io-client';
const socket = io("http://localhost:2001");

export default async function initGame() {
    const k = makeKaplayCtx();

    k.setLayers(['bg', 'game', 'fg'], 'game')

    // load font
    k.loadFont('gaegu', './fonts/Gaegu-Regular.ttf')

    // load letters
    for (let i = 0; i < 26; i++)
        k.loadSprite(`${String.fromCharCode(65 + i)}`, `./letters/${String.fromCharCode(65 + i)}.png`)

	
    // scenes
    init_menu(k)
    init_game(k)

    let data = {socket: socket}
	k.go('menu', data)
}