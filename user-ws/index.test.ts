import { resolve } from "bun";
import {test, describe} from "bun:test";
const BACKEND_URL = "ws://localhost:8080"
 
describe("Chat Application",()=>{

    test("Message sent from room 1 reaches another participant in room 1",async()=>{
            const ws1 = new WebSocket(BACKEND_URL);
            const ws2 = new WebSocket(BACKEND_URL);

            await new Promise<void>((resolve,reject)=>{
                let count = 0;

                ws1.onopen =() =>{
                    count = count + 1;
                    if(count == 2){
                        resolve()
                    }
            }

                ws2.onopen =() =>{
                    count = count + 1;
                    if(count == 2){
                        resolve()
                    }
            }


            })

            

            ws1.send(JSON.stringify({
                type : "join-room",
                room : "Room 1"
            }))

                ws2.send(JSON.stringify({
                type : "join-room",
                room : "Room 1"
            }))

            await new Promise((resolve)=>{
                ws2.onmessage = ({data}) =>{
                    const parsedData = JSON.parse(data);
                const parsedData = JSON.parse(data);
                expect(parsedData.type == "chat")
                expect(parsedData.message == "Hi vro") 
                
                resolve()
            }

                ws1.send(JSON.stringify({
                type : "chat msg",
                room : "Room 1",
                message : "Hi vro"
            }))

            })

            

          



    })

})