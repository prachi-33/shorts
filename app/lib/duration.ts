import { prisma } from "./db"

export const videoDuration = async (videoId: string) => {
    try {
        const video = await prisma.video.findUnique({
            where: {
                videoId: videoId
            }
        })

        if (!video) {
            console.error("Video not found:", videoId);
            throw new Error("Video not found");
        }

        const captions = video.captions as any[];

        // Check if captions exist and have data
        if (!captions || !Array.isArray(captions) || captions.length === 0) {
            console.error("No captions found for video:", videoId);
            throw new Error("Captions not available or empty");
        }

        const calculatedDuration = captions[captions.length - 1].endFrame;

        if (!calculatedDuration || calculatedDuration <= 0) {
            console.error("Invalid duration calculated:", calculatedDuration);
            throw new Error("Invalid duration");
        }

        await prisma.video.update({
            where: {
                videoId: videoId
            },
            data: {
                duration: calculatedDuration
            }
        })

        console.log(`Video duration set to ${calculatedDuration} frames`);
        return calculatedDuration;

    } catch (err) {
        console.error("Error calculating video duration:", err);
        throw err;
    }
}