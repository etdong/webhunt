import { KAPLAYCtx } from "kaplay";

export default function drawPlayers(k: KAPLAYCtx, socket: any) {
    let players: { [key: string]: any } = {};
    
    socket.on('new_con', (data: any) => {
        
    })

    socket.on('socket_info', (data: any) => {
        for (let i = 0; i < data.length; i++) {
            if (players[i] === undefined) {
                players[i] = k.add([
                    k.text(data[i], { size: 32 }),
                    k.pos(0, 80 * i),
                    k.color(255, 0, 255),
                ]);
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