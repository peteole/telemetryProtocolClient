import { SensorValue } from "./SensorValue";

export class Message {
    id: number
    value: SensorValue
    constructor(value: SensorValue, id: number) {
        if (id <= 1 || id > 255) {
            throw new Error("id not in valid range")
        }
        this.id = id
        this.value = value
    }
    parse(toParse: ArrayBuffer): boolean {
        if (new Uint8Array(toParse).length != this.value.size) {
            //return false if wrong length or stream with too big length
            if (this.value.name !== "stream" || new Uint8Array(toParse).length > this.value.size)
                return false
        }
        this.value.parse(toParse)
        this.value.onUpdate?.();
        return true
    }
}

const STREAM_MESSAGE_ID = 254
class StreamMessageSensorValue extends SensorValue {
    size: number
    getBasicSensorValues() { return [] }
    name = "stream"
    outputBuffer: string[] = []
    onMessage: (s: string) => void
    parse(m: ArrayBuffer) {
        //remove zero-byte with slice
        this.onMessage(new TextDecoder().decode(m.slice(0, m.byteLength - 1)))
        return true;
    }
    serialize() {
        console.error("You cannot serialize a string message!");
        return new ArrayBuffer(0)
    }
    constructor(size = 500, onMessage = (s: string) => console.log(s)) {
        super()
        this.size = size
        this.onMessage = onMessage
    }
}
export class StreamMessage extends Message {
    _value: StreamMessageSensorValue
    constructor(onMessage = (s: string) => console.log(s)) {
        super(new StreamMessageSensorValue(500, onMessage), STREAM_MESSAGE_ID);
        this._value = this.value as StreamMessageSensorValue
    }
    append(message: string) {
        this._value.outputBuffer.push(message)
    }
    /**encode all buffered messages to an Arraybuffer, remove them from the queue and return the buffer */
    encodeAndFlush() {
        const encodeString = (s: string) => {
            const toEncode = new TextEncoder().encode(s)
            const target: number[] = [0, this.id]
            for (const byte of toEncode) {
                target.push(byte);
                if (byte === 0)
                    target.push(0)
            }
            // Add encoded null byte and end of message bytes
            target.push(0, 0, 0, 1)
            return new Uint8Array(target)
        }
        const encodedMessages = this._value.outputBuffer.map(s => encodeString(s))
        this._value.outputBuffer = []
        return encodedMessages.reduce((prev, curr) => Uint8Array.from([...prev, ...curr]))
    }
}