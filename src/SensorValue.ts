export abstract class SensorValue {
    name: string = "";
    size: number = 0;
    abstract parse(message: ArrayBuffer): boolean;
    abstract getBasicSensorValues(): NumberSensorValue[];
    replaceBasicSensorValues: (knownSet: SensorValue[]) => SensorValue = (knownSet) => this
}
export type NumberType = "uint8" | "uint16" | "uint32" | "int8" | "int16" | "int32" | "float32" | "float64"
type NumberParser = {
    name: NumberType,
    size: number,
    parse: (raw: ArrayBuffer) => number
}
export const parsers: { [k: string]: NumberParser } = {
    uint8: {
        name: "uint8",
        size: 1,
        parse: (raw) => new Uint8Array(raw)[0]
    },
    uint16: {
        name: "uint16",
        size: 2,
        parse: (raw) => new Uint16Array(raw)[0]
    },
    uint32: {
        name: "uint32",
        size: 4,
        parse: (raw) => new Uint32Array(raw)[0]
    },
    int8: {
        name: "int8",
        size: 1,
        parse: (raw) => new Int8Array(raw)[0]
    },
    int16: {
        name: "int16",
        size: 2,
        parse: (raw) => new Int16Array(raw)[0]
    },
    int32: {
        name: "int32",
        size: 4,
        parse: (raw) => new Int32Array(raw)[0]
    },
    float32: {
        name: "float32",
        size: 4,
        parse: (raw) => new Float32Array(raw)[0]
    },
    float64: {
        name: "float64",
        size: 4,
        parse: (raw) => new Float64Array(raw)[0]
    },
}
/**
 * 
 * @param numberType for example int or float
 * @param size in bytes
 * @returns number parser
 */
export const getNumberParser = (numberType: string, size: number) => {
    return parsers[numberType + (8 * size)];
}
export class NumberSensorValue extends SensorValue {
    getBasicSensorValues(): NumberSensorValue[] {
        return [this]
    }
    parser: NumberParser
    value: number = 0
    constructor(name: string, parser: NumberParser) {
        super()
        this.name = name
        this.parser = parser
        this.size = parser.size
        this.replaceBasicSensorValues = (knownValues) => {
            const foundValue = knownValues.find(val => val.name == this.name)
            return foundValue == undefined ? this : foundValue
        }
    }
    parse(message: ArrayBuffer): boolean {
        this.value = this.parser.parse(message)
        return true
    }
}
export class SensorValueList extends SensorValue {
    getBasicSensorValues(): NumberSensorValue[] {
        return this.sensorValues.filter(val => val instanceof NumberSensorValue) as NumberSensorValue[]
    }
    sensorValues: SensorValue[]
    constructor(sensorValues: SensorValue[]) {
        super()
        this.sensorValues = sensorValues
        this.sensorValues.forEach(val => this.size += val.size)
        this.replaceBasicSensorValues = (knownSet) => {
            for (const i in this.sensorValues) {
                this.sensorValues[i] = this.sensorValues[i].replaceBasicSensorValues(knownSet)
            }
            return this
        }
    }
    parse(message: ArrayBuffer): boolean {
        let position = 0
        for (let sensorValue of this.sensorValues) {
            sensorValue.parse(message.slice(position, position + sensorValue.size))
            position += sensorValue.size
        }
        return position == this.size
    }

}