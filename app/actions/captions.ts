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

    /* console.log("Generating captions for video:", videoId);
    
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

    console.log(`Generated ${captions.length} captions`); */
    const captions=[
      {
        "text": "Welcome",
        "endFrame": 13,
        "startFrame": 5
      },
      {
        "text": "to",
        "endFrame": 18,
        "startFrame": 13
      },
      {
        "text": "the",
        "endFrame": 24,
        "startFrame": 18
      },
      {
        "text": "celebration",
        "endFrame": 41,
        "startFrame": 24
      },
      {
        "text": "of",
        "endFrame": 47,
        "startFrame": 41
      },
      {
        "text": "Albert",
        "endFrame": 59,
        "startFrame": 47
      },
      {
        "text": "Einstein's",
        "endFrame": 78,
        "startFrame": 59
      },
      {
        "text": "birthday.",
        "endFrame": 94,
        "startFrame": 78
      },
      {
        "text": "Let's",
        "endFrame": 116,
        "startFrame": 103
      },
      {
        "text": "take",
        "endFrame": 120,
        "startFrame": 116
      },
      {
        "text": "a",
        "endFrame": 125,
        "startFrame": 120
      },
      {
        "text": "moment",
        "endFrame": 133,
        "startFrame": 125
      },
      {
        "text": "to",
        "endFrame": 139,
        "startFrame": 133
      },
      {
        "text": "honor",
        "endFrame": 151,
        "startFrame": 139
      },
      {
        "text": "a",
        "endFrame": 158,
        "startFrame": 151
      },
      {
        "text": "genius",
        "endFrame": 173,
        "startFrame": 158
      },
      {
        "text": "who",
        "endFrame": 179,
        "startFrame": 173
      },
      {
        "text": "changed",
        "endFrame": 190,
        "startFrame": 179
      },
      {
        "text": "the",
        "endFrame": 193,
        "startFrame": 190
      },
      {
        "text": "world.",
        "endFrame": 202,
        "startFrame": 193
      },
      {
        "text": "Today",
        "endFrame": 228,
        "startFrame": 216
      },
      {
        "text": "we",
        "endFrame": 239,
        "startFrame": 228
      },
      {
        "text": "celebrate",
        "endFrame": 254,
        "startFrame": 239
      },
      {
        "text": "not",
        "endFrame": 262,
        "startFrame": 254
      },
      {
        "text": "just",
        "endFrame": 269,
        "startFrame": 262
      },
      {
        "text": "his",
        "endFrame": 276,
        "startFrame": 269
      },
      {
        "text": "birth,",
        "endFrame": 288,
        "startFrame": 276
      },
      {
        "text": "but",
        "endFrame": 299,
        "startFrame": 288
      },
      {
        "text": "the",
        "endFrame": 306,
        "startFrame": 299
      },
      {
        "text": "incredible",
        "endFrame": 325,
        "startFrame": 306
      },
      {
        "text": "legacy",
        "endFrame": 340,
        "startFrame": 325
      },
      {
        "text": "he",
        "endFrame": 347,
        "startFrame": 340
      },
      {
        "text": "left",
        "endFrame": 352,
        "startFrame": 347
      },
      {
        "text": "behind",
        "endFrame": 360,
        "startFrame": 352
      },
      {
        "text": "in",
        "endFrame": 372,
        "startFrame": 362
      },
      {
        "text": "science",
        "endFrame": 382,
        "startFrame": 372
      },
      {
        "text": "and",
        "endFrame": 391,
        "startFrame": 382
      },
      {
        "text": "humanity.",
        "endFrame": 410,
        "startFrame": 391
      },
      {
        "text": "His",
        "endFrame": 432,
        "startFrame": 422
      },
      {
        "text": "theories",
        "endFrame": 445,
        "startFrame": 432
      },
      {
        "text": "revolutionized",
        "endFrame": 469,
        "startFrame": 445
      },
      {
        "text": "our",
        "endFrame": 479,
        "startFrame": 469
      },
      {
        "text": "understanding",
        "endFrame": 496,
        "startFrame": 479
      },
      {
        "text": "of",
        "endFrame": 500,
        "startFrame": 496
      },
      {
        "text": "time",
        "endFrame": 505,
        "startFrame": 500
      },
      {
        "text": "and",
        "endFrame": 511,
        "startFrame": 505
      },
      {
        "text": "space,",
        "endFrame": 521,
        "startFrame": 511
      },
      {
        "text": "making",
        "endFrame": 550,
        "startFrame": 540
      },
      {
        "text": "us",
        "endFrame": 558,
        "startFrame": 550
      },
      {
        "text": "rethink",
        "endFrame": 575,
        "startFrame": 558
      },
      {
        "text": "the",
        "endFrame": 580,
        "startFrame": 575
      },
      {
        "text": "universe.",
        "endFrame": 595,
        "startFrame": 580
      },
      {
        "text": "Let's",
        "endFrame": 623,
        "startFrame": 610
      },
      {
        "text": "remember",
        "endFrame": 634,
        "startFrame": 623
      },
      {
        "text": "him",
        "endFrame": 642,
        "startFrame": 634
      },
      {
        "text": "not",
        "endFrame": 650,
        "startFrame": 642
      },
      {
        "text": "just",
        "endFrame": 656,
        "startFrame": 650
      },
      {
        "text": "as",
        "endFrame": 662,
        "startFrame": 656
      },
      {
        "text": "a",
        "endFrame": 668,
        "startFrame": 662
      },
      {
        "text": "scientist,",
        "endFrame": 684,
        "startFrame": 668
      },
      {
        "text": "but",
        "endFrame": 695,
        "startFrame": 684
      },
      {
        "text": "as",
        "endFrame": 702,
        "startFrame": 695
      },
      {
        "text": "a",
        "endFrame": 707,
        "startFrame": 702
      },
      {
        "text": "person",
        "endFrame": 715,
        "startFrame": 707
      },
      {
        "text": "filled",
        "endFrame": 727,
        "startFrame": 718
      },
      {
        "text": "with",
        "endFrame": 732,
        "startFrame": 727
      },
      {
        "text": "joy",
        "endFrame": 743,
        "startFrame": 732
      },
      {
        "text": "and",
        "endFrame": 754,
        "startFrame": 743
      },
      {
        "text": "wonder",
        "endFrame": 766,
        "startFrame": 754
      },
      {
        "text": "about",
        "endFrame": 774,
        "startFrame": 766
      },
      {
        "text": "the",
        "endFrame": 782,
        "startFrame": 774
      },
      {
        "text": "universe.",
        "endFrame": 797,
        "startFrame": 782
      },
      {
        "text": "Happy",
        "endFrame": 833,
        "startFrame": 824
      },
      {
        "text": "birthday,",
        "endFrame": 849,
        "startFrame": 833
      },
      {
        "text": "Albert",
        "endFrame": 863,
        "startFrame": 849
      },
      {
        "text": "Einstein.",
        "endFrame": 884,
        "startFrame": 863
      },
      {
        "text": "Your",
        "endFrame": 916,
        "startFrame": 905
      },
      {
        "text": "spirit",
        "endFrame": 931,
        "startFrame": 916
      },
      {
        "text": "of",
        "endFrame": 934,
        "startFrame": 931
      },
      {
        "text": "inquiry",
        "endFrame": 956,
        "startFrame": 934
      },
      {
        "text": "continues",
        "endFrame": 973,
        "startFrame": 956
      },
      {
        "text": "to",
        "endFrame": 977,
        "startFrame": 973
      },
      {
        "text": "inspire",
        "endFrame": 991,
        "startFrame": 977
      },
      {
        "text": "us",
        "endFrame": 997,
        "startFrame": 991
      },
      {
        "text": "all.",
        "endFrame": 1006,
        "startFrame": 997
      }
  ]

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