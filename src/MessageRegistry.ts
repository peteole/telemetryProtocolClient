import { Message } from "./Message";

export class MessageRegistry{
    private currentMessage:Message|null=null
    private buffer:ArrayBuffer=new ArrayBuffer(0)
    private currentPosition:number=0
    private previousByteZero:boolean=false
}