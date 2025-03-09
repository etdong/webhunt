import { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import drawBoard from "../components/board";
import { updateCamPos, updateCamZoom } from "../utils/camUtils";

import socket from "src/components/socket";

export default function init_game(k: KAPLAYCtx) {
    k.scene('game', (data) => {

        // declarations
        let total_score = 0;
        let selected: any[] = [];
        let points: Vec2[] = [];
        let time = data.time || 60;
        let size = data.size || 4;
        let side_length = 128 * size;

        socket.emit('signal_ready', socket.id);

        // component drawing
        let board = drawBoard(k, socket, size);

        let score_output = k.add([
            k.text('score:' + total_score, { size: 48, font: 'gaegu' }),
            k.pos(board.pos.x - board.width/2, board.pos.y - board.height/2 - 64),
            k.color(0, 0, 0),
            'output'
        ])

        let word_output = k.add([
            k.text('', { size: 64, font: 'gaegu', align: 'center'}),   
            k.pos(board.pos.x, board.pos.y + board.height/2 + 96),
            k.color(0, 0, 0),
            k.anchor('center'),
            'output'
        ])

        k.add([
            k.anchor('topright'),
            k.text('time: ', { size: 48, font: 'gaegu', align: 'right'}),
            k.pos(board.pos.x + board.width/2 - 32, board.pos.y - board.height/2 - 64),
            k.color(0, 0, 0),
        ]);


        // timer setup
        let timer_output = k.add([
            k.anchor('topright'),
            k.text(time, { size: 48, font: 'gaegu', align: 'right'}),
            k.pos(board.pos.x + board.width/2, board.pos.y - board.height/2 - 64),
            k.color(0, 0, 0),
        ]);

        socket.on('game_start', () => {
            if (time > 0) {
                k.loop(1, () => {
                    time -= 1;
                    timer_output.text = time;
                    if (time <= 0) {
                        k.go('menu', { socket: socket, state: 'end' });
                        let data = {
                            id: socket.id,
                            score: total_score,
                        }
                        socket.emit('submit_score', data);
                    }
                })
            }
        })
        

        // socket handling

        socket.on('score', (score: number) => {
            total_score += score;
            score_output.text = 'score: ' + total_score;
            word_output.text += score;
        })

        socket.on('word_repeated', () => {
            word_output.text += 'already found'
        })

        socket.off('board').on('board', (letters: { [key: number]: string[] }) => {
            console.log('board received:', letters);
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {    
                    k.add([
                        k.sprite(letters[i][j]),
                        k.scale(0.5),
                        k.area({ shape: new k.Polygon([
                            k.vec2(96, 0),
                            k.vec2(160, 0),
                            k.vec2(256, 96),
                            k.vec2(256, 160),
                            k.vec2(160, 256),
                            k.vec2(96, 256),
                            k.vec2(0, 160),
                            k.vec2(0, 96),
                        ])}),
                        k.pos(k.center().sub(side_length/2 - i * 128, side_length/2 - j * 128)),
                        letters[i][j],
                        'letter',
                    ])
                }   
            }
            k.onDraw(() => {
                k.drawLines({ pts: points, width: 10, color: k.rgb(255, 0, 0), cap: 'round' });
            })
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
                            points.push(letter.pos.add(64));
                        }
                    } else {
                        selected.push(letter);
                        points.push(letter.pos.add(64));
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
                let data = {
                    id: socket.id,
                    word: word,
                }
                socket.emit('word', data);
            }
            selected = [];
        })

        k.onUpdate(() => {
            updateCamZoom(k);
            updateCamPos(k, board.pos);
        })
    })

}