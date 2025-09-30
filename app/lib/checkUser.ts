"use server"
import { currentUser } from "@clerk/nextjs/server";
import {prisma} from './db'

const checkUser =async()=>{
    const user=await currentUser();
    if(user){
        try{
            const userId=user.id;
            const email=user.primaryEmailAddress?.emailAddress;
            const existingUser= await prisma.user.findUnique({
                where:{
                    userId:userId
                }
            })
            console.log(existingUser);
            if(!existingUser){
                const newUser=await prisma.user.create({
                    data:{
                        userId:userId,
                        email:email ?? ""
                    }
                })
                console.log("New user created",newUser)
                return newUser.userId;
            }
            return user.id
        }catch(err){
            console.log(err);
        }
    }
    else if (!user){
        return null
    }

}
export default checkUser