import { KAPLAYCtx } from "kaplay";

export default function drawPlayers(k: KAPLAYCtx, socket: any) {
    let players: { [key: string]: any } = {};
    
    socket.on('new_con', (data: any) => {
        
    })

    socket.on('socket_info', (data: any) => {
        for (let i in data) {
            if (players[i] === undefined) {
                players[i] = k.add([
                    k.text(i, { size: 32 }),
                    k.pos(data[i].x, data[i].y),
                    k.color(255, 0, 255),
                ]);
            } else {
                players[i].pos = k.vec2(data[i].x, data[i].y);
            }
        }
        
        for (let i in players) {
            if (data[i] === undefined) {
                players[i].destroy();
                delete players[i];
            }
        }

    })
}