import { prisma } from "../lib/db";
import { AssemblyAI } from "assemblyai";

const apiKey=process.env.ASSEMBLY_API || "";

const client = new AssemblyAI({
  apiKey: apiKey,
});

export const generateCaptions = async (videoId: string) => {
  try {
    const video = await prisma.video.findUnique({
      where: {
        videoId: videoId
      }
    });

    if (!video || !video.audio) {
      console.log("Video or audio URL not found");
      return null;
    }

    console.log("Generating captions for video:", videoId);
    
    const transcript = await client.transcripts.transcribe({
      audio: video.audio
    });

    const captions = transcript.words
      ? transcript.words.map(word => ({
          text: word.text,
          startFrame: Math.round((word.start / 1000) * 30),
          endFrame: Math.round((word.end / 1000) * 30)
        }))
      : [];

    console.log(`Generated ${captions.length} captions`); 
    

    await prisma.video.update({
      where: {
        videoId: videoId
      },
      data: {
        captions: captions
      }
    });

    return captions;
  } catch (err) {
    console.error("Error generating captions:", err);
    throw err;
  }
};