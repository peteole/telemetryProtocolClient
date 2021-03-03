export abstract class SensorValue {
    name: string = "";
    size: number = 0;
    abstract parse(message: ArrayBuffer): boolean;
}
type NumberParser = {
    name: string,
    size: number,
    parse: (raw: DataView) => number
}
const parsers: { [k: string]: NumberParser } = {
    uint8: {
        name: "uint8",
        size: 1,
        parse: (raw) => raw.getUint8(0)
    },
    uint16: {
        name: "uint16",
        size: 2,
        parse: (raw) => raw.getUint16(0)
    },
    int8: {
        name: "int8",
        size: 1,
        parse: (raw) => raw.getInt8(0)
    },
    int16: {
        name: "int16",
        size: 2,
        parse: (raw) => raw.getInt8(0)
    },
    float32: {
        name: "float32",
        size: 4,
        parse: (raw) => raw.getFloat32(0)
    },
    float64: {
        name: "float64",
        size: 4,
        parse: (raw) => raw.getFloat64(0)
    },
}
export class NumberSensorValue extends SensorValue {
    parser: NumberParser
    value: number = 0
    constructor(name: string, parser: NumberParser) {
        super()
        this.name = name
        this.parser = parser
        this.size = parser.size
    }
    parse(message: ArrayBuffer): boolean {
        this.value = this.parser.parse(new DataView(message))
        return true
    }
}
export class SensorValueList extends SensorValue {
    sensorValues: SensorValue[]
    constructor(sensorValues: SensorValue[]) {
        super()
        this.sensorValues = sensorValues
        this.sensorValues.forEach(val => this.size += val.size)
    }
    parse(message: ArrayBuffer): boolean {
        let position = 0
        for (let sensorValue of this.sensorValues) {
            sensorValue.parse(message.slice(position, sensorValue.size))
            position += sensorValue.size
        }
        return position == this.size
    }

}