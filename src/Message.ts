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
        const messageID = new DataView(toParse).getUint8(0)
        if (messageID != this.id || new Uint8Array(toParse).length != this.value.size + 1) {
            //return false if wrong id or length (+1 because of message id)
            return false
        }
        this.value.parse(toParse.slice(1))
        return true
    }
}