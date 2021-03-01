export abstract class SensorValue {
    name: string = "";
    size: number = 0;
    abstract parse(message: ArrayBuffer): boolean;
}
export class BasicSensorValue<T> extends SensorValue{
    parse(message:DataView):boolean{
        return true
    }
}