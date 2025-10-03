import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { processes } from '../app/actions/process';
import {prisma} from "../app/lib/db"
import { error } from 'console';

const connection= new Redis('redis://default:ufEkcTndXb4xTlQw0DIw7PcTq5tpyamz@redis-10399.c326.us-east-1-3.ec2.redns.redis-cloud.com:10399', {
    maxRetriesPerRequest: null,
})

const worker=new Worker('video-processing',async(job)=>{
    const {videoId} =job.data;
    console.log(`processing video with id ${videoId}`)

    try{
        await processes(videoId)
        console.log(`successfuly processed video with id ${videoId}`)
    }catch{
        console.error(`error while processsing of video ${videoId}`)
        await prisma.video.update({
            where:{
                videoId:videoId
            },
            data:{
                processing:false,
                failed:true
            }

        })
        throw error

    }
    
},{
    concurrency:2,
    connection
})
worker.on('completed',(job,err)=>{
    console.log(`${job?.id} failed`,err.message)
})

worker.on("failed",(job,err)=>{
    console.log(`${job?.id} failed`,err.message)
})

worker.on('error',(err)=>{
    console.log("worker error",err)
})

console.log("worker started ... connected to redis")