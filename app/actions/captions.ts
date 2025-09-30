import {prisma} from "../lib/db";

export const generateCaptions= async(videoId:string)=>{
    const video=await prisma.video.findUnique({
        where:{
            videoId:videoId
        }
    })
    if(!video)[
        return null
    ]
}