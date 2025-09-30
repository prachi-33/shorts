"use server"
import OpenAI from "openai";
const openai=new OpenAI({
    apiKey:process.env.OPENAI_API_KEY
})
export const generateScript =async (part:string)=>{
    const prompt = `write a script to generate a 30 second video on topic "${part} along with ai image prompt in realistic format for each scene and give me the result in json format wtih image prompt and content texts as fields . just give me image prompt and contnet text in an array. PLEASE DON'T GIVE ANY OTHER RESPONSE LIKE "scene1" etc .JUST GIVE WHAT I ASKET ONLY .keep the name of response array as "content"- which would be containing the objects.    `
    
    const response = await openai.chat.completions.create({
        model:"gpt-4o-mini",
        messages:[
            {
                role:"user",
                content:[{type:"text",text:prompt}]
            }
        ],
        response_format:{
            "type":"json_object"
        }
    });
    return response.choices[0]?.message.content;
}