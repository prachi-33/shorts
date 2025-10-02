"use server"
import { revalidatePath } from 'next/cache';
import {prisma} from './db'

import { currentUser } from "@clerk/nextjs/server"

export async function  deleteVideo(videoId:string){
    try{
        const user=await currentUser();
        if(!user){
            return null;
        }
        const userId=user.id;
        await prisma.video.delete({
            where:{
                videoId:videoId,
                userId:userId
            }
        })
        revalidatePath('/dashboard')
        return {success:true}
    }catch(err){
        return {success:false ,error:"Failed to delete video"}
    }
}