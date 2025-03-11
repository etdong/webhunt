import { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import drawBoard from "../components/board";
import { updateCamPos, updateCamZoom } from "../utils/camUtils";

import socket from "src/components/socket";

export default function init_game(k: KAPLAYCtx) {
    k.scene('game', (data) => {

        // declarations
        let board: { [key: number]: string[] } = data.board;
        let time: number = data.round_time;
        let room_id = data.room_id;

        let total_score = 0;
        let selected: any[] = [];
        let points: Vec2[] = [];
        let size = Object.keys(board).length;
        let side_length = 128 * size;

        let background = k.add([
            k.rect(k.width(), k.height()),
            k.anchor('center'),
            k.pos(k.center()),
        ])
        updateCamPos(k, background.pos);
        updateCamZoom(k);

        k.setCamScale(k.getCamScale().x * 5/size);

        // component drawing
        let board_container = drawBoard(k, size);

        let score_output = k.add([
            k.text('score:' + total_score, { size: 48, font: 'gaegu' }),
            k.pos(board_container.pos.x - board_container.width/2, board_container.pos.y - board_container.height/2 - 64),
            k.color(0, 0, 0),
            'output'
        ])

        let word_output = k.add([
            k.text('', { size: 64, font: 'gaegu', align: 'center'}),   
            k.pos(board_container.pos.x, board_container.pos.y + board_container.height/2 + 96),
            k.color(0, 0, 0),
            k.anchor('center'),
            'output'
        ])

        k.add([
            k.anchor('topright'),
            k.text('time: ', { size: 48, font: 'gaegu', align: 'right'}),
            k.pos(board_container.pos.x + board_container.width/2 - 32, board_container.pos.y - board_container.height/2 - 64),
            k.color(0, 0, 0),
        ]);


        // timer setup
        let timer_output = k.add([
            k.anchor('topright'),
            k.text(time.toString(), { size: 48, font: 'gaegu', align: 'right'}),
            k.pos(board_container.pos.x + board_container.width/2, board_container.pos.y - board_container.height/2 - 64),
            k.color(0, 0, 0),
        ]);

        k.loop(1, () => {
            time -= 1;
            timer_output.text = time.toString();
            if (time <= 0) {
                socket.emit('submit_score', socket.id, total_score, (response: any) => {
                    if (response.status === 'ok') {
                        k.go('scores', room_id);
                    } else {
                        console.log(response.message);
                    }
                });
            }
        })
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {   
                let letterPos = k.vec2(k.center().sub(side_length/2 - 64 - i * 128, side_length/2 - 64 - j * 128))
                k.add([
                    k.polygon([
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
                        k.vec2(100, 128),
        
                    ]),
                    k.outline(6),
                    k.scale(0.5),
                    k.color(k.rgb(255, 224, 170)),
                    k.area({shape: new k.Polygon([
                        k.vec2(128, -32),
                        k.vec2(128, 32),
                        k.vec2(32, 128),
                        k.vec2(-32, 128),
                        k.vec2(-128, 32),
                        k.vec2(-128, -32),
                        k.vec2(-32, -128),
                        k.vec2(32, -128),
                    ])}),
                    k.pos(letterPos),
                    board[i][j],
                    'letter',
                ])
                k.add([
                    k.text(board[i][j], {size: 64, font: 'gaegu'}),
                    k.pos(letterPos),
                    k.anchor('center'),
                    k.color(0, 0, 0),
                    k.z(1),
                ])
            }   
        }
        k.onDraw(() => {
            k.drawLines({ 
                pts: points, 
                width: 10, 
                color: k.rgb(255, 0, 0),
                opacity: 0.5,
                cap: 'round' });
        })



        // event handlers
        

        k.onHoverUpdate('letter', (letter) => {
            if (k.isMouseDown('left')) {
                if (!(selected.includes(letter))) {
                    if (selected.length > 0) {
                        // check if the next letter is adjacent to the previous
                        let last = selected[selected.length - 1];
                        let dist_x = Math.abs(last.pos.sub(letter.pos).x);
                        let dist_y = Math.abs(last.pos.sub(letter.pos).y);
                        if (
                            dist_x <= 130 &&
                            dist_y <= 130
                        ) {
                            selected.push(letter);
                            points.push(letter.pos);
                        }
                    } else {
                        selected.push(letter);
                        points.push(letter.pos);
                    }
                }
            }
        })

        k.onMouseRelease('left', () => {
            points = [];
            if (selected.length > 2) {
                let word = '';
                selected.forEach((letter: GameObj) => {
                    word += letter.tags[1];
                })
                word_output.text = word + '\n';
                socket.emit('word', socket.id, word, (response: any) => {
                    if (response.status === 'ok') {
                        total_score += response.score;
                        score_output.text = 'score: ' + total_score;
                        word_output.text += response.score;
                    } else if (response.status === 'repeated') {
                        word_output.text += 'already found'
                    }
                });
            }
            selected = [];
        })

        k.onUpdate(() => {
            updateCamPos(k, board_container.pos);
        })
    })

}