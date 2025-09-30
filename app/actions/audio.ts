"use server"
import {prisma} from "../lib/db";
export const generateAudio=async(videoId:string)=>{
    try{
        const video=await prisma.video.findUnique({
            where:{
                videoId:videoId
            }
        })
        if(!video || !video.content){
            return null
        }
        console.log("In video now")

    }catch(err){
        console.error("error genrating audio",err)
        throw err;
    }

}