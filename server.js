import { WebSocketServer } from 'ws';
import { RETURN_CODES, SHARD_TYPES, PACKET_TYPES, Packet, PacketShard} from './client/client.mjs';

const wss = new WebSocketServer({ port: 3000 })

var clientsConnected = 0;
var clientIDs = ["player1","player2"]
var client_data = {}

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

wss.on('connection', function(ws) {
    if (clientsConnected+1 > clientIDs.length){
        ws.close(RETURN_CODES.SERVER_FULL.code , RETURN_CODES.SERVER_FULL.desc);
        return;
    }

    let client_id = clientIDs[clientsConnected];
    clientsConnected++;

    client_data[client_id] = {};

    let id_shard = new PacketShard("SETUP_ID", client_id);
    let init_packet = new Packet("server", [id_shard], "INIT_PACKET");

    ws.send(JSON.stringify(init_packet));


    ws.on('error', console.error);

    ws.on('message', function (data) {
        data = data.toString()

        let packet_received = JSON.parse(data)


        if (packet_received.type == "KEY_PACKET"){
            for (let shard_i in packet_received.shards){
                let shard = packet_received.shards[shard_i]

                client_data[client_id][shard.type] = shard.data;
            }
            
        }

        displayCurrentData();
    });

    ws.on('close', function (code) {
         if (code == RETURN_CODES.CLIENT_LEAVE.code){
             console.warn("Client (ID: "+ client_id +") disconnected.");
         }
    })

})