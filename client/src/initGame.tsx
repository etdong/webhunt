import makeKaplayCtx from "./kaplayCtx";

// scene initializers
import init_game from "./scenes/game";
import init_menu from "./scenes/menu";
import init_create_room from "./scenes/create_room";
import init_room from "./scenes/room";
import init_join_room from "./scenes/join_room";
import init_rooms_list from "./scenes/rooms_list";
import init_scores from "./scenes/scores";
import init_stats from "./scenes/stats";

export default async function initGame() {
	const k = makeKaplayCtx()

    k.setLayers(['bg', 'game', 'fg'], 'game')

    // load font
    k.loadFont('gaegu', './fonts/Gaegu-Regular.ttf')
	
    // initialize scenes
    init_menu(k)
    init_game(k)
    init_room(k)
    init_rooms_list(k)
    init_join_room(k)
    init_create_room(k)
    init_scores(k)
    init_stats(k)

	k.go('menu')
}