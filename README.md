# Telemetry Protocol client

This is a javascript client used to parse and send back messages from an arduino using my telemetry protocol:
https://github.com/peteole/telemetryProtocol
## installation
npm i telemetryprotocolclient

## example usage
`````js
import { Message, MessageRegistry } from "telemetryprotocolclient/dist/index"
...
// initialize websocket:WebSocket

const registry=new MessageRegistry();
registry.onMessage =(message)=>console.log(message);
websocket.onmessage = (ev) => {
                (ev.data as Blob).arrayBuffer().then((buffer) => {
                    streamHook.onData(buffer)
                    for (const sensVal of registry.basicSensorValues) {
                            console.log(sensVal.name,":", sensVal.value);
                        }
                    }
                })
            }
registry.streamMessage.append("Hallo Welt, lieber Arduino");
websocket.send(registry.encodeMessage(registry.streamMessage));
```