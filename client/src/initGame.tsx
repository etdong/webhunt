import init_game from "./scenes/game";
import init_menu from "./scenes/menu";
import init_create_room from "./scenes/create_room";

import makeKaplayCtx from "./kaplayCtx";

import socket from "src/components/socket";
import init_room from "./scenes/room";
import init_join_room from "./scenes/join_room";
import init_rooms_list from "./scenes/rooms_list";

export default async function initGame() {
	const k = makeKaplayCtx()

    k.setLayers(['bg', 'game', 'fg'], 'game')

    // load font
    k.loadFont('gaegu', './fonts/Gaegu-Regular.ttf')

    // load letters
    for (let i = 0; i < 26; i++)
        k.loadSprite(`${String.fromCharCode(65 + i)}`, `./letters/${String.fromCharCode(65 + i)}.png`)

	
    // scenes
    init_menu(k)
    init_game(k)
    init_room(k)
    init_rooms_list(k)
    init_join_room(k)
    init_create_room(k)

	k.go('rooms_list')
}