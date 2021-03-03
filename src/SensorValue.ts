export abstract class SensorValue {
    name: string = "";
    size: number = 0;
    abstract parse(message: DataView): boolean;
}
export class BasicSensorValue<T> extends SensorValue {
    parse(message: DataView): boolean {
        return true
    }
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
}export class NumberSensorValue extends SensorValue {
    parser: NumberParser
    value: number = 0
    constructor(name: string, parser: NumberParser) {
        super()
        this.name = name
        this.parser = parser
        this.size = parser.size
    }
    parse(message: DataView): boolean {
        this.value = this.parser.parse(message)
        return true
    }
}