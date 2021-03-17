import { NumberType, SensorValue, parsers, NumberSensorValue, SensorValueList, getNumberParser } from "./SensorValue";

type AbstractSensorValueDTO = {
    name: string;
    size: number;
}
export interface BasicSensorValueDTO extends AbstractSensorValueDTO {
    type: NumberType
}
export interface SensorValueListDTO extends AbstractSensorValueDTO {
    values: SensorValueDTO[]
}
type SensorValueDTO = BasicSensorValueDTO | SensorValueListDTO
function isAbstractSensorValueDTO(toCheck: any): toCheck is AbstractSensorValueDTO {
    return (toCheck as AbstractSensorValueDTO).name !== undefined && (toCheck as AbstractSensorValueDTO).size !== undefined
}

export function isBasicSensorValueDTO(toCheck: any): toCheck is BasicSensorValueDTO {
    return isAbstractSensorValueDTO(toCheck) && (toCheck as BasicSensorValueDTO).type !== undefined
}
export function isBasicSensorValueDTOConstrained(toCheck: SensorValueDTO): toCheck is BasicSensorValueDTO {
    return (toCheck as SensorValueListDTO).values === undefined
}
export function isSensorValueDTO(toCheck: any): toCheck is SensorValueDTO {
    return isBasicSensorValueDTO(toCheck) || !isSensorValueListDTO(toCheck)
}
export function isSensorValueListDTO(toCheck: any): toCheck is SensorValueListDTO {
    try {
        if (!isAbstractSensorValueDTO(toCheck))
            return false
        const values = (toCheck as SensorValueListDTO).values
        if (values === undefined)
            return false
        for (const val of values) {
            if (!isBasicSensorValueDTO(val) || !isSensorValueListDTO(val)) {
                return false
            }
        }
    } catch (error) {
        return false
    }
    return true
}

export function toSensorValue(dto: SensorValueDTO): SensorValue {
    if (isBasicSensorValueDTOConstrained(dto)) {
        return new NumberSensorValue(dto.name, getNumberParser(dto.type, dto.size))
    } else {
        const sensorValues: SensorValue[] = dto.values.map(val => toSensorValue(val))
        return new SensorValueList(sensorValues)
    }
}