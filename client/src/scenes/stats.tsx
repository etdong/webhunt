import { KAPLAYCtx } from "kaplay";
import { updateCamPos, updateCamZoom } from "../utils/camUtils";

import socket from "src/components/socket";

/**
 * Initializes the stats screen
 * @param k KAPLAY context
 */
export default function init_stats(k: KAPLAYCtx) {
    k.scene('stats', () => {
        
        // draw components
        // draw background and update camera position
        let background = k.add([
            k.rect(k.width(), k.height()),
            k.anchor('center'),
            k.pos(k.center()),
        ])
        updateCamPos(k, background.pos);
        updateCamZoom(k);

        // draw the stats
        let stats = drawStats(k);

        // screen title
        let title = k.add([
            k.text('Stats for ', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x, k.center().y - 320),
            k.anchor('center'),
            k.color(0, 0, 0),
        ])

        // back button
        let back = k.add([
            k.text('back', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x , k.center().y + 320),
            k.anchor('center'),
            k.area(),
            k.color(0, 0, 0),
            k.scale(1),
            'menu_button',
        ])

        back.onClick(() => {
            k.go('menu');
        })

        // hover animations
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

        // request stats from server
        socket.emit('request_stats', socket.id, (response: any) => {
            if (response.status === 'ok') {
                let user = response.user
                // update title and stat values
                title.text += user.name;
                stats[0].text = user.total_score;
                stats[1].text = user.highest_score;
                stats[2].text = user.games_played;
                stats[3].text = user.games_won;
                stats[4].text = user.avg_score_per_game.toFixed(2);
                stats[5].text = user.words_found;
                stats[6].text = user.avg_score_per_word.toFixed(2);
            } else {
                console.log(response.message);
            }
        })

        // update camera position and zoom
        k.onUpdate(() => {
            updateCamPos(k, background.pos);
            updateCamZoom(k);
        })
    })
}

/**
 * Draws the labels and numbers for the stats screen
 * @param k KAPLAY context
 * @returns The stat value components
 */
function drawStats(k: KAPLAYCtx) {
    let stats = [];
    let stat_labels = ['total score', 'highest score', 'games played', 'games won', 'avg score/game', 'words found', 'avg score/word'];
    for (let i = 0; i < stat_labels.length; i++) {
        // draw label
        k.add([
            k.text(stat_labels[i] + ':', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x, k.center().y - 224 + i * 64),
            k.anchor('right'),
            k.color(0, 0, 0),
        ])

        // draw value
        let stat = k.add([
            k.text('', { size: 64, font: 'gaegu' }),
            k.pos(k.center().x + 32, k.center().y - 224 + i * 64),
            k.anchor('left'),
            k.color(0, 0, 0),
        ])

        stats.push(stat);
    }

    return stats;
}