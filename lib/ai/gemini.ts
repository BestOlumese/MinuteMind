import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";
import path from "path";
import os from "os";
import prisma from "@/lib/prisma";
import { parseBuffer } from "music-metadata"; // <--- IMPORT THIS

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

export async function processMeetingAudio(meetingId: string, audioUrl: string) {
  let tempFilePath = "";
  
  try {
    console.log(`[AI] Starting processing for meeting: ${meetingId}`);

    // 1. Download File
    const response = await fetch(audioUrl);
    if (!response.ok) throw new Error("Failed to fetch audio file");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- NEW: EXTRACT DURATION ---
    // We parse the buffer to get accurate duration in seconds
    const metadata = await parseBuffer(buffer);
    const durationInSeconds = Math.round(metadata.format.duration || 0);
    console.log(`[AI] Audio Duration: ${durationInSeconds} seconds`);

    // 2. Save to Temp File
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `${meetingId}.mp3`);
    await fs.promises.writeFile(tempFilePath, buffer);
    console.log(`[AI] File saved locally to: ${tempFilePath}`);

    // 3. Upload to Gemini
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: "audio/mp3",
      displayName: `Meeting ${meetingId}`,
    });
    console.log(`[AI] Uploaded to Gemini: ${uploadResult.file.uri}`);

    // 4. Generate Content 
    // Note: Verify your region supports gemini-2.0-flash-exp, otherwise use gemini-2.5-flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash" 
    });

    const prompt = `
      You are an expert executive assistant. Listen to this meeting recording and extract structured data.
      Output strictly valid JSON.
      {
        "summary": "Concise summary.",
        "transcript": [{ "speaker": "Name", "timestamp": "00:00", "text": "..." }],
        "actionItems": [{ "task": "Task description", "assignee": "Name", "dueDate": "YYYY-MM-DD" }]
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
    ]);

    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanedJson);

    // 5. Update Database
    await prisma.$transaction(async (tx) => {
      await tx.meeting.update({
        where: { id: meetingId },
        data: {
          status: "COMPLETED",
          summary: data.summary,
          transcript: data.transcript ?? [],
          duration: durationInSeconds, // <--- SAVING DURATION HERE
        },
      });

      if (data.actionItems && data.actionItems.length > 0) {
        await tx.actionItem.createMany({
          data: data.actionItems.map((item: any) => ({
            meetingId: meetingId,
            task: item.assignee ? `${item.task} (Assigned to: ${item.assignee})` : item.task,
            isCompleted: false,
            dueDate: item.dueDate ? new Date(item.dueDate) : null
          })),
        });
      }
    });

    // 6. Cleanup
    await fileManager.deleteFile(uploadResult.file.name);
    await fs.promises.unlink(tempFilePath);
    console.log("[AI] Cleanup complete");

  } catch (error) {
    console.error("[AI ERROR]", error);
    
    if (tempFilePath && fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath).catch(() => {}); 
    }

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "FAILED" }
    });
  }
}