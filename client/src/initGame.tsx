import makeKaplayCtx from "./kaplayCtx";
import init_menu from "./scenes/menu";

import io from 'socket.io-client';
const socket = io("http://localhost:2001");

export default async function initGame() {
    const k = makeKaplayCtx();

    // load font
    k.loadFont('gaegu', './fonts/Gaegu-Regular.ttf')

    // load letters
    k.loadSprite('w', './letters/w.png')
    k.loadSprite('e', './letters/e.png')
    k.loadSprite('b', './letters/b.png')
    k.loadSprite('h', './letters/h.png')
    k.loadSprite('u', './letters/u.png')
    k.loadSprite('n', './letters/n.png')
    k.loadSprite('t', './letters/t.png')


	
    // scenes
    init_menu(k)

    let data = {socket: socket}
	k.go('menu', data)
}