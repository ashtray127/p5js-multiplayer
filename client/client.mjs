// RETURN_CODE structure:
//      1xxx - Success codes
//      2xxx - Nonfatal error codes
//      3xxx - Partially fatal error codes (Program doesn't need to crash, but that specific part is unrecoverable)
//      4xxx - Fully fatal error codes. Game will crash.
//      5xxx - Misc return codes
export const RETURN_CODES = Object.freeze({
    // 1xxx ---------------------
    CLIENT_LEAVE: { code: 1001, desc: "Client gracefully disconnected." },
    SERVER_SHUTDOWN: { code: 1006, desc: "Server gracefully shutdown." },

    PACKET_SENT: { code: 1002, desc: "Packet successfully sent." },

    // 2xxx ---------------------
    MESSAGE_NOT_PACKET: { code: 2001, desc: "Message requested to send is not a packet." },
    
    // 3xxx --------------------- 
    PACKET_NO_ARGUMENTS: { code: 3001, desc: "No arguments were provided for creation of a packet."},
    PACKET_INVALID_SENDER: { code: 3002, desc: "Invalid sender specified for packet."},
    PACKET_INVALID_SHARDS: {code: 3003, desc: "The shards supplied to packet creation weren't proper packet shards, or weren't in an array."},
    PACKET_INVALID_TYPE: { code: 3004, desc: "Type of packet supplied wasn't a valid packet type." },

    SHARD_INVALID_TYPE: { code: 3005, desc: "No valid type was provided for shard. " },
    SHARD_INVALID_DATA: { code: 3006, desc: "The data provided for the shard didn't pass the shard's data check." },

    // 4xxx -------------------
    SERVER_FULL: { code: 4001, desc: "The server doesn't have space for you." }
})

export const PACKET_TYPES = [
    "GENERIC",
    "INIT_PACKET",
    "KEY_PACKET"
]

export const SHARD_TYPES = Object.freeze({
    SETUP_ID: {id: 'setup-player-id', check: (data) => { return typeof data == "string" } },

    W_DOWN: {id: "key-w-down", check: (data) => { return typeof data == "boolean" } },
    A_DOWN: {id: "key-a-down", check: (data) => { return typeof data == "boolean" } },
    S_DOWN: {id: "key-s-down", check: (data) => { return typeof data == "boolean" } },
    D_DOWN: {id: "key-d-down", check: (data) => { return typeof data == "boolean" } }, 
})

export class PacketShard {
    constructor(type, data){
        if ( !(type in SHARD_TYPES ) ) return RETURN_CODES.SHARD_INVALID_TYPE;

        let data_check = SHARD_TYPES[type].check
        if ( !(data_check(data)) ) return RETURN_CODES.SHARD_INVALID_DATA;

        this.type = type;
        this.data = data;
    }
}

export class Packet {
    constructor(sender_id, shards, packet_type=null){
        if (arguments.length < 2) return RETURN_CODES.PACKET_NO_ARGUMENTS;

        if (typeof sender_id != "string") return RETURN_CODES.PACKET_INVALID_SENDER;

        if ( !(shards instanceof Array ) ) return RETURN_CODES.PACKET_INVALID_SHARDS;
        if (!shards.every((shard) => { return shard instanceof PacketShard })) return RETURN_CODES.PACKET_INVALID_SHARDS;

        if (packet_type != null){
            if ( !(PACKET_TYPES.includes(packet_type)) ) return RETURN_CODES.PACKET_INVALID_TYPE;
            
            this.type = packet_type;
        } else this.type = "GENERIC";


        this.sender = sender_id;
        this.shards = shards;
    }
}

export class Client {
    constructor(){
        let socket = new WebSocket("ws://localhost:3000")

        socket.onopen = this.whenOpen;

        socket.onmessage = this.whenMessage;

        socket.onclose = this.whenClose;

        this.socket = socket;


    }

    sendPacket(packet){
        if ( !(packet instanceof Packet)  ) return RETURN_CODES.MESSAGE_NOT_PACKET;

        this.socket.send(JSON.stringify(packet))

        return RETURN_CODES.PACKET_SENT;
    }

    whenOpen(){
        
    }

    whenMessage(message){
        let packet = JSON.parse(message.data);


        if (packet.type == "INIT_PACKET"){
            for (let shardIndex in packet.shards){

                let shard = packet.shards[shardIndex];
                if (shard.type == "SETUP_ID") {
                    this.id = shard.data; 
                    console.log("ID Received from server: " + shard.data);
                }

            }
        } 
    }

    whenClose(closeEvent){
        console.error("WebSocket closed with code " + closeEvent.code + ": " + closeEvent.reason)
    }
}