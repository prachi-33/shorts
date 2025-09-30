"use server"
import { findPrompt } from "../lib/findPrompt"
import { generateScript } from "./script"
import { prisma } from "../lib/db";
import { generateImage } from "./image";
import { generateAudio } from "./audio";
import { generateCaptions } from "./captions"; // Import this
import { videoDuration } from "../lib/duration";

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

        // Step 2: Generate audio (needs content)
        console.log("Step 2: Generating audio...");
        const audioUrl = await generateAudio(videoId);
        if (!audioUrl) {
            throw new Error("Failed to generate audio");
        }
        console.log("Audio generated:", audioUrl);

        // Step 3: Generate captions (needs audio URL)
        console.log("Step 3: Generating captions...");
        const captions = await generateCaptions(videoId);
        if (!captions || captions.length === 0) {
            throw new Error("Failed to generate captions");
        }
        console.log(`Captions generated: ${captions.length} captions`);

        // Step 4: Calculate duration (needs captions)
        console.log("Step 4: Calculating duration...");
        const duration = await videoDuration(videoId);
        console.log("Duration calculated:", duration);

        // Step 5: Generate image (can run independently)
        console.log("Step 5: Generating image...");
        const imageUrl = await generateImage(videoId);
        console.log("Image generated:", imageUrl);

        console.log("Video processing completed successfully!");
        return { audioUrl, captions, duration, imageUrl };

    } catch (err) {
        console.error("Error in making video:", err);
        throw err;
    }
}