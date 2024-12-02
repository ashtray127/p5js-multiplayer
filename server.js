import { WebSocketServer } from 'ws';
import { RETURN_CODES, SHARD_TYPES, PACKET_TYPES, Packet, PacketShard} from './client/client.mjs';

const wss = new WebSocketServer({ port: 3000 })

var client_data = {
    player1: {},
    player2: {}
};

function displayCurrentData(){
    console.clear();
    for (let client_i in client_data){
        let client = client_data[client_i]

        console.log(client_i + ": ")
        for (let data_point in client){

            console.log("  - " + data_point + ": " + client[data_point])

        }

        console.log();
    }
}

function processKeys(){
    for (let id in client_data){
        let client = client_data[id];

        if (client.W_DOWN){
            client.pos.y--;
        }
        if (client.A_DOWN){
            client.pos.x--;
        }
        if (client.S_DOWN){
            client.pos.y++;
        }
        if (client.D_DOWN){
            client.pos.x++;
        }

        let data_shard = new PacketShard("POS", client.pos)

        let pos_packet = new Packet("server", [data_shard])

        return pos_packet;
    }
}

wss.on('connection', function(ws) {
    let client_id; 
    for (let id in client_data) {

	    let data = client_data[id];

	    if (Object.keys(data).includes("connected")) {

	        if (!data.connected) {
	            client_id = id;
                break;
	        }
	    
        } else {
            client_id = id;
            break;
        }

    }

    if (typeof client_id === "undefined") {
        ws.close(RETURN_CODES.SERVER_FULL.code , RETURN_CODES.SERVER_FULL.desc);
        return;
    }

    client_data[client_id] = {
        connected: true,
        pos: { x: 0, y: 0 }
    };

    let id_shard = new PacketShard("SETUP_ID", client_id);
    let init_packet = new Packet("server", [id_shard], "INIT_PACKET");

    ws.send(JSON.stringify(init_packet));


    ws.on('error', console.error);

    ws.on('message', function (data) {
        data = data.toString()

        let packet_received = JSON.parse(data)


        if (packet_received.type == "KEY_PACKET") {
            for (let shard_i in packet_received.shards){
                let shard = packet_received.shards[shard_i]

                client_data[client_id][shard.type] = shard.data;
            }

            let pos_packet = processKeys();

            ws.send(pos_packet);
            
        }

        displayCurrentData();
    });

    ws.on('close', function (code) {
         if (code == RETURN_CODES.CLIENT_LEAVE.code){
             console.warn("Client (ID: "+ client_id +") disconnected.");
	     client_data[client_id].connected = false;
         }

        displayCurrentData();
    })

    displayCurrentData();
})
