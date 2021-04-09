import { Message, StreamMessage } from "./Message";
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

                        //push new basic sensor values dominantly
                        const newBasicSensorVals = messageSensorValue.getBasicSensorValues();
                        registry.basicSensorValues = registry.basicSensorValues.filter(val => newBasicSensorVals.findIndex(el => el.name === val.name) === -1)
                        registry.basicSensorValues.push(...newBasicSensorVals)
                        messageDefinitionMessage.value.message = newMessage

                        // remove old message with same id if it exists
                        const oldIndex = registry.messages.findIndex(m => m.id == newMessage.id);
                        if (oldIndex != -1) {
                            console.log("attention, added same message id again!")
                            registry.messages.splice(oldIndex, 1)
                        }
                        registry.addMessage(newMessage)
                    }
                } catch (error) {
                    return false
                }
                return true
            },
            serialize: () => {
                // this tells the sender to resend all message definitions. There does not need to be any content in this message.
                return new Uint8Array([])
            },
            size: maxMessageDefinitionSize,
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

    messageDefinitionMessage: Message
    /**called when an unknown message is recieved. May be used to request the data schema in this case. */
    onUnknownMessage: null | (() => void) = null
    streamMessage: StreamMessage

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
                    if (index == -1) {
                        this.currentMessage = null
                        this.onUnknownMessage?.()
                    } else {
                        this.currentMessage = this.messages[index]
                    }
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
    constructor(messages: Message[] = [], onMessage = (s: string) => console.log(s)) {
        this.messageDefinitionMessage = getMessageDefinitionMessage(this)
        messages.push(this.messageDefinitionMessage)
        this.streamMessage = new StreamMessage(onMessage)
        messages.push(this.streamMessage)
        messages.forEach(m => this.addMessage(m))
    }

    set onMessage(onMessage: (s: string) => void) {
        this.streamMessage._value.onMessage = onMessage
    }

    /** get Arraybuffer which is ready to be sent to the microcontroller from message */
    encodeMessage(message: Message) {
        const toEncode = new Uint8Array(message.value.serialize())
        const target: number[] = [0, message.id]
        for (const byte of toEncode) {
            target.push(byte);
            if (byte === 0)
                target.push(0)
        }
        target.push(0, 1)
        return new Uint8Array(target)
    }
}
const maxMessageDefinitionSize = 10000;