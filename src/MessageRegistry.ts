import { Message } from "./Message";
import { isSensorValueDTO, toSensorValue } from "./MessageDTO";
import { NumberSensorValue, SensorValue } from "./SensorValue";
interface MessageDescriptionSensorValue extends SensorValue {
    message: Message | null
}
interface MessageDescriptionMessage extends Message {
    value: MessageDescriptionSensorValue,
    registry: MessageRegistry
}
const getMessageDefinitionMessage = (registry: MessageRegistry): MessageDescriptionMessage => {
    const messageDefinitionMessage: MessageDescriptionMessage = {
        id: 255,
        parse: (toParse) => {
            return messageDefinitionMessage.value.parse(toParse)
        },
        value: {
            name: "message",
            parse: (message) => {
                const decoder = new TextDecoder("utf-8")
                const messageID = new Uint8Array(message)[0]
                const descriptionString = decoder.decode(message.slice(1))
                try {
                    const messageDTO: any = JSON.parse(descriptionString)
                    if (isSensorValueDTO(messageDTO)) {
                        const messageSensorValue = toSensorValue(messageDTO)
                        const newMessage = new Message(messageSensorValue, messageID)
                        newMessage.value = newMessage.value.replaceBasicSensorValues(registry.basicSensorValues)
                        registry.basicSensorValues.push(...messageSensorValue.getBasicSensorValues().filter(val => registry.basicSensorValues.findIndex(el => el.name === val.name) === -1))
                        messageDefinitionMessage.value.message = newMessage
                    }
                } catch (error) {
                    return false
                }
                return true
            },
            size: Infinity,
            replaceBasicSensorValues: val => messageDefinitionMessage.value,
            message: null,
            getBasicSensorValues: () => []
        },
        registry: registry
    }
    return messageDefinitionMessage
}
export class MessageRegistry {
    private currentMessage: Message | null = null
    private buffer: ArrayBuffer = new ArrayBuffer(0)
    private bufferView = new Uint8Array(this.buffer)
    private currentPosition: number = 0
    private previousByteZero: boolean = false
    basicSensorValues: NumberSensorValue[] = []
    messages: Message[] = []

    readData(data: ArrayBuffer) {
        for (let nextValue of new Uint8Array(data)) {
            if (this.currentPosition >= (this.currentMessage !== null ? this.currentMessage.value : 0)) {
                this.currentPosition = 0
            }
            if (this.previousByteZero) {
                if (nextValue == 0) {
                    //zero occured in message
                    this.bufferView[this.currentPosition] = nextValue
                    this.currentPosition++
                } else if (nextValue == 1) {
                    // End of message reached
                    if (this.currentMessage) {
                        this.currentMessage.parse(this.buffer.slice(0, this.currentPosition));
                        this.currentMessage = null
                    }
                }
                else {
                    //start of new message
                    const index = this.messages.findIndex(m => m.id == nextValue)
                    this.currentMessage = index == -1 ? null : this.messages[index]
                }
                this.previousByteZero = false;
            }
            else {
                if (nextValue == 0) {
                    this.previousByteZero = true;
                }
                else {
                    this.bufferView[this.currentPosition] = nextValue;
                    this.currentPosition++;
                }
            }
        }
    }
    addMessage(toAdd: Message) {
        this.messages.push(toAdd)
        this.buffer = new ArrayBuffer(Math.max(...this.messages.map(m => m.value.size)))
        this.bufferView = new Uint8Array(this.buffer)
    }
    constructor(messages: Message[] = []) {
        messages.push(getMessageDefinitionMessage(this))
        messages.forEach(m => this.addMessage(m))
    }
    static fromJSON(json: string) {

    }
}