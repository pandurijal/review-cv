/* eslint-disable @typescript-eslint/no-require-imports */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface Feedback {
  summary: {
    score: string;
    keyStrengths: string[];
  };
  detailedReview: {
    [key: string]: {
      title: string;
      strengths: string[];
      improvements: string[];
      keywordScore?: string;
      missingKeywords?: string[];
    };
  };
  priorityActions: Array<{
    id: number;
    title: string;
    example?: {
      before: string;
      after: string;
    };
    bullets?: string[];
  }>;
}

async function validateCV(text: string): Promise<boolean> {
  const message = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 10,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `Determine if this is a CV/resume. Reply only with "true" or "false":

${text}`,
      },
    ],
  });

  return message.content[0].text.toLowerCase().includes("true");
}

async function extractText(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    const buffer = await file.arrayBuffer();
    const data = await pdfParse(Buffer.from(buffer));
    return data.text;
  }
  return file.text();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const textContent = await extractText(file);
    if (!textContent.trim()) {
      return NextResponse.json(
        { success: false, error: "No text content found in file" },
        { status: 400 }
      );
    }

    // Validate if document is a CV
    const isCV = await validateCV(textContent);
    if (!isCV) {
      return NextResponse.json(
        {
          success: false,
          error: "Uploaded document does not appear to be a CV/resume",
        },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: `Analyze this CV and provide detailed feedback in JSON format. You must return ONLY raw JSON - no markdown, no code blocks, no explanations.

CV Content:
${textContent}

Analyze the CV and return a JSON object that strictly matches this structure (extra fields not allowed):

{
  "summary": {
    "score": "one of: Outstanding/Good/Average/Needs Work",
    "keyStrengths": ["strength1", "strength2", ...]
  },
  "detailedReview": {
    "sectionName": {
      "title": "section title",
      "strengths": ["strength1", "strength2", ...],
      "improvements": ["improvement1", "improvement2", ...],
      "keywordScore": "optional score",
      "missingKeywords": ["optional", "missing", "keywords"]
    }
  },
  "priorityActions": [
    {
      "id": 1,
      "title": "action title",
      "example": {
        "before": "example before",
        "after": "example after"
      },
      "bullets": ["bullet1", "bullet2", ...]
    }
  ]
}`,
        },
      ],
    });

    try {
      const feedback: Feedback = JSON.parse(message.content[0].text);
      return NextResponse.json({
        success: true,
        fileInfo: {
          name: file.name,
          type: file.type,
          size: file.size,
        },
        feedback,
      });
    } catch (parseError) {
      console.error("JSON Parse Error:", message.content[0].text);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse AI response",
          rawResponse: message.content[0].text,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}
