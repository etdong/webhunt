import { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import drawBoard from "../components/board";
import { updateCamPos, updateCamZoom } from "../utils/updateCam";

export default function init_game(k: KAPLAYCtx) {
    k.scene('game', (data) => {
        
        // declarations
        let total_score = 0;
        let selected: any[] = [];
        let points: Vec2[] = [];
        let time = data.time || 60;
        let size = data.size || 4;


        // component drawing
        let board = drawBoard(k, size);

        let score_output = k.add([
            k.text('score: ' + total_score, { size: 32, font: 'gaegu' }),
            k.pos(board.pos.x - board.width/2, board.pos.y - board.height/2 - 48),
            k.color(0, 0, 0),
            'output'
        ])

        let word_output = k.add([
            k.text('', { size: 32, font: 'gaegu', align: 'center'}),   
            k.pos(board.pos.x, board.pos.y + board.height/2 + 48),
            k.color(0, 0, 0),
            k.anchor('center'),
            'output'
        ])

        k.add([
            k.anchor('topright'),
            k.text('time: ', { size: 32, font: 'gaegu', align: 'right'}),
            k.pos(board.pos.x + board.width/2 - 32, board.pos.y - board.height/2 - 48),
            k.color(0, 0, 0),
        ]);


        // timer setup
        let timer_output = k.add([
            k.anchor('topright'),
            k.text(time, { size: 32, font: 'gaegu', align: 'right'}),
            k.pos(board.pos.x + board.width/2, board.pos.y - board.height/2 - 48),
            k.color(0, 0, 0),
        ]);

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
                    socket.emit('final_score', data);
                }
            })
        }
        

        // socket handling
        let socket = data.socket;

        socket.on('score', (score: number) => {
            total_score += score;
            score_output.text = 'score: ' + total_score;
            word_output.text += score;
        })

        socket.on('word_repeated', () => {
            word_output.text += 'already found'
        })


        // event handlers
        k.onDraw(() => {
            k.drawLines({ pts: points, width: 10, color: k.rgb(255, 0, 0), cap: 'round' });
        })

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