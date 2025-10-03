"use server"
import { findPrompt } from "../lib/findPrompt"
import { generateScript } from "./script"
import { prisma } from "../lib/db";
import { generateImage } from "./image";
import { generateAudio } from "./audio";
import { generateCaptions } from "./captions"; 
import { videoDuration } from "../lib/duration";
import { renderVideo } from "./render";

export const processes = async (videoId: string) => {
    try {
        console.log("Starting video processing for:", videoId);

        // Step 1: Generate script from prompt
        console.log("Step 1: Generating script...");
        const prompt = await findPrompt(videoId);
        if (!prompt) {
            throw new Error("Prompt not found");
        }

        const script = await generateScript(prompt);
        if (!script) {
            throw new Error("Failed to generate script");
        }

        const scriptData = JSON.parse(script);
        const contentTexts = scriptData.content.map((data: { content_text: string }) => data.content_text);
        const fullContent = contentTexts.join(" ");
        const imagePrompts = scriptData.content.map((data: { image_prompt: string }) => data.image_prompt);
        
        console.log("Image prompts:", imagePrompts);
        console.log("Full content:", fullContent);

        // Update video with content and image prompts
        await prisma.video.update({
            where: {
                videoId: videoId
            },
            data: {
                content: fullContent,
                imagePrompts: imagePrompts
            }
        });

        const imagesPromise = generateImage(videoId)
        await generateAudio(videoId)
        await generateCaptions(videoId)
        await imagesPromise;
        await videoDuration(videoId)

        await renderVideo(videoId)

    } catch (err) {
        console.error("Error in making video:", err);
        throw err;
    }
}