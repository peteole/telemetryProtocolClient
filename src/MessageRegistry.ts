import { Message } from "./Message";

export class MessageRegistry {
    private currentMessage: Message | null = null
    private buffer: ArrayBuffer = new ArrayBuffer(0)
    private bufferView = new Uint8Array()
    private currentPosition: number = 0
    private previousByteZero: boolean = false
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
                        this.currentMessage.parse(this.buffer);
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
            else
            {
                if (nextValue == 0)
                {
                    this.previousByteZero = true;
                }
                else
                {
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
}