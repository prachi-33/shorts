import { Queue } from "bullmq";
import Redis from "ioredis";

const connection= new Redis('redis://default:ufEkcTndXb4xTlQw0DIw7PcTq5tpyamz@redis-10399.c326.us-east-1-3.ec2.redns.redis-cloud.com:10399', {
    maxRetriesPerRequest: null,
})

export const videoQueue= new Queue('video-processing',{
    connection,
    defaultJobOptions:{
        removeOnComplete:10,
        removeOnFail:5,
    }
})