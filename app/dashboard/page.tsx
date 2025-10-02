import React from 'react'
import { currentUser } from '@clerk/nextjs/server'
import {prisma} from "../lib/db"
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Dashboard =async()=> {
    const user= await currentUser();
    if(!user){
        return null
    }
    const videos=await prisma.video.findMany({
        where:{
            userId:user.id
        },
        orderBy:{
            createdAt:'desc'
        }
    })
    return (
        <div className='container mx-auto p-6'>
            <div className='flex justify-between items-center mb-8'>
                <h1 className='text-3xl font-bold'>Your Videos</h1>
                <div className='flex items-center gap-2'>
                    <Link href="/new">
                        <Button className=''>

                        </Button>
                    </Link>
                </div>

            </div>

        </div>
    )


  
}

export default Dashboard