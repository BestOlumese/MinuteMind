import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import prisma from "../prisma";

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

export async function processMeetingAudio(meetingId: string, audioUrl: string) {
  try {
    console.log(`[AI] Starting processing for meeting: ${meetingId}`);

    // 1. Download the file from UploadThing to a Buffer
    const response = await fetch(audioUrl);
    if (!response.ok) throw new Error("Failed to fetch audio file");
    const arrayBuffer = await response.arrayBuffer();
    
    // Create a temporary path or upload directly via buffer if supported, 
    // but the Node SDK usually prefers paths. 
    // efficient hack: We create a temporary file in /tmp for the upload
    const fs = require('fs');
    const path = require('path');
    const tempFilePath = path.join('/tmp', `${meetingId}.mp3`);
    fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));

    // 2. Upload to Gemini File Manager
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: "audio/mp3",
      displayName: `Meeting ${meetingId}`,
    });

    console.log(`[AI] Audio uploaded to Gemini: ${uploadResult.file.uri}`);

    // 3. Prompt Gemini
    // We use Flash for speed. Use 'gemini-1.5-pro' for higher accuracy on complex accents.
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    const prompt = `
      You are an expert executive assistant. Listen to this meeting recording and extract structured data.
      
      Output strictly valid JSON with no markdown formatting (no \`\`\`json).
      
      The JSON structure must be:
      {
        "summary": "A concise executive summary of the meeting (2-3 paragraphs).",
        "transcript": [
          { "speaker": "Speaker 1", "timestamp": "00:15", "text": "..." }
        ],
        "actionItems": [
          { "task": "What needs to be done", "assignee": "Name of person (or Unassigned)", "dueDate": "YYYY-MM-DD or null" }
        ]
      }

      Rules:
      1. Identify speakers by name if mentioned, otherwise use "Speaker 1", "Speaker 2".
      2. For the transcript, break it down into logical segments.
      3. For action items, infer the assignee and due date from context if possible.
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
    
    // Clean the response (sometimes Gemini adds markdown ticks)
    const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanedJson);

    // 4. Save to Database
    await prisma.$transaction(async (tx) => {
      // A. Update Meeting Details
      await tx.meeting.update({
        where: { id: meetingId },
        data: {
          status: "COMPLETED",
          summary: data.summary,
          transcript: data.transcript, // Prisma handles the JSON array automatically
        },
      });

      // B. Create Action Items
      // Note: We are just storing the name as text. Linking to real User IDs requires complex fuzzy matching.
      if (data.actionItems && data.actionItems.length > 0) {
        await tx.actionItem.createMany({
          data: data.actionItems.map((item: any) => ({
            meetingId: meetingId,
            task: item.task,
            // We append the assignee name to the task description if we can't link a user
            // In a real app, you'd search prisma.user.findFirst({ where: { name: { contains: item.assignee }}})
            task: item.assignee && item.assignee !== "Unassigned" 
                  ? `${item.task} (Assigned to: ${item.assignee})` 
                  : item.task,
            isCompleted: false,
            // Simple date parsing if Gemini returns ISO, otherwise null
            dueDate: item.dueDate ? new Date(item.dueDate) : null
          })),
        });
      }
    });

    console.log(`[AI] Processing complete for ${meetingId}`);

    // 5. Cleanup: Delete file from Gemini (save storage costs) and local /tmp
    await fileManager.deleteFile(uploadResult.file.name);
    fs.unlinkSync(tempFilePath);

  } catch (error) {
    console.error("[AI ERROR]", error);
    // Mark as failed so the user knows to try again
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "FAILED" }
    });
  }
}