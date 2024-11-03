"use client";

import React, { useEffect, useState } from "react";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Type definitions
interface DetailedReviewSectionProps {
  title: string;
  strengths: string[];
  improvements: string[];
  extra?: Record<string, string | string[]>;
}

interface PriorityActionCardProps {
  number: number;
  title: string;
  example?: {
    before: string;
    after: string;
  };
  bullets?: string[];
}

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

// Subcomponents
const DetailedReviewSection: React.FC<DetailedReviewSectionProps> = ({
  title,
  strengths,
  improvements,
  extra,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">
              Strengths
            </h4>
            <div className="space-y-2">
              {strengths.map((strength, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">
              Areas for Improvement
            </h4>
            <div className="space-y-2">
              {improvements.map((improvement, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-amber-600"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{improvement}</span>
                </div>
              ))}
            </div>
          </div>

          {extra && (
            <div className="mt-4 pt-4 border-t">
              {Object.entries(extra).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm text-gray-600">{key}:</span>
                  <span className="text-sm font-medium">
                    {Array.isArray(value) ? value.join(", ") : value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PriorityActionCard: React.FC<PriorityActionCardProps> = ({
  number,
  title,
  example,
  bullets,
}) => (
  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm border border-blue-200">
    <div className="flex items-center space-x-3 mb-4">
      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
        {number}
      </div>
      <h3 className="font-semibold text-blue-900">{title}</h3>
    </div>
    {example ? (
      <div className="space-y-3 text-gray-700">
        <div className="pl-4 border-l-2 border-blue-200">
          <div className="text-sm">Before:</div>
          <div className="text-gray-500">&quot;{example.before}&quot;</div>
        </div>
        <div className="pl-4 border-l-2 border-green-200">
          <div className="text-sm">After:</div>
          <div className="text-green-700">&quot;{example.after}&quot;</div>
        </div>
      </div>
    ) : (
      <ul className="space-y-2 text-gray-700">
        {bullets?.map((bullet, index) => (
          <li key={index} className="flex items-start space-x-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

// Main component
const CVReviewer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleFileSelect = async (selectedFile: File) => {
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = [
      "application/pdf",
      // "application/msword",
      // "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      // "text/plain",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF file");
      return;
    }

    if (selectedFile.size > maxSize) {
      setError("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setError("");
    setLoading(true);

    try {
      const feedbackData = await analyzeCv(selectedFile);
      setFeedback(feedbackData);
    } catch (error) {
      setError(`Failed to analyze CV. Please try again.\n\n${error}`);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCv = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/analyze-cv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze CV");
      }

      return data.feedback;
    } catch (error) {
      console.error("Error analyzing CV:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            CV Review Assistant
          </h1>
          <p className="mt-2 text-gray-600">
            Get instant, AI-powered feedback on your CV
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${
            dragActive ? "ring-2 ring-blue-500 scale-102" : ""
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="p-6">
            {file ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setFeedback(null);
                  }}
                  className="p-2 hover:bg-blue-100 rounded-full"
                >
                  <X className="w-5 h-5 text-blue-600" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <p className="text-gray-700">
                    Drag and drop your CV here, or{" "}
                    <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                      browse
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                      />
                    </label>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Please upload a PDF file (max 5MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-3 p-4 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center p-8 bg-white rounded-xl shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Analyzing your CV...</p>
          </div>
        )}

        {/* Results */}
        {feedback && (
          <div className="space-y-8">
            {/* Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Award className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Overall Assessment
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {feedback.summary.score}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Key Strengths</p>
                  <ul className="mt-1 space-y-1">
                    {feedback.summary.keyStrengths.map((strength, index) => (
                      <li
                        key={index}
                        className="text-green-700 flex items-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Detailed Review */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">
                Detailed Review
              </h2>
              <div className="space-y-3">
                {Object.entries(feedback.detailedReview).map(
                  ([key, section]) => (
                    <DetailedReviewSection
                      key={key}
                      title={section.title}
                      strengths={section.strengths}
                      improvements={section.improvements}
                      extra={
                        key === "atsOptimization"
                          ? {
                              "Keyword Score": section.keywordScore,
                              "Missing Keywords": section.missingKeywords,
                            }
                          : null
                      }
                    />
                  )
                )}
              </div>
            </div>

            {/* Priority Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">
                Priority Actions
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {feedback.priorityActions.map((action) => (
                  <PriorityActionCard
                    key={action.id}
                    number={action.id}
                    title={action.title}
                    example={action.example}
                    bullets={action.bullets}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVReviewer;
