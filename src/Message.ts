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
        if (new Uint8Array(toParse).length != this.value.size) {
            //return false if wrong length
            return false
        }
        this.value.parse(toParse)
        return true
    }
}