"use server"
import { findPrompt } from "../lib/findPrompt"
import { generateScript } from "./script"
import {prisma} from "../lib/db";
import { generateImage } from "./image";
import { generateAudio } from "./audio";

export const processes = async(videoId:string)=>{
    try{
        const prompt=await findPrompt(videoId)
        const script = await generateScript(prompt || "")
        const scriptData=JSON.parse(script || "");
        const contentTexts=scriptData.content.map((data:{content_text:string})=> data.content_text)
        const fullContent=contentTexts.join(" ")
        const imagePrompts=scriptData.content.map((data:{image_prompt:string})=>data.image_prompt)
        console.log(imagePrompts)
        console.log(fullContent)

        await prisma.video.update({
            where:{
                videoId:videoId
            },
            data:{
                content:fullContent,
                imagePrompts:imagePrompts
            }
        }) 

        await generateImage(videoId)
        await generateAudio(videoId)


    }catch(err){
        console.error("error in making video",err)
        throw err
    }
}