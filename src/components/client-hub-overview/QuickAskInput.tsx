/**
 * QuickAskInput - Compact "Ask a question" input for client hub overview
 *
 * Simplified version of InstantAnswerInput for the overview page.
 * On submit: creates answer job and navigates to instant answers page with answerId.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, MessageSquareText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateInstantAnswer } from "@/hooks";

interface QuickAskInputProps {
  hubId: string;
}

const suggestedQuestions = [
  "Budget status?",
  "Next deadline?",
  "Who's working on this?",
  "Project timeline?",
];

export function QuickAskInput({ hubId }: QuickAskInputProps) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const createAnswer = useCreateInstantAnswer(hubId);

  const handleSubmit = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || createAnswer.isPending) return;

    try {
      const result = await createAnswer.mutateAsync({ question: trimmed });
      // Navigate to instant answers page with answerId in state
      navigate(`/portal/${hubId}/instant-answers`, {
        state: { answerId: result.answerId },
      });
    } catch {
      // Error will be shown inline
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(question);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!createAnswer.isPending) {
      handleSubmit(suggestion);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <MessageSquareText
              className="h-5 w-5 text-[hsl(var(--bold-royal-blue))]"
              aria-hidden="true"
            />
            <h3 className="font-semibold text-[hsl(var(--dark-grey))]">
              Ask a Question
            </h3>
          </div>

          {/* Input form */}
          <form onSubmit={handleFormSubmit} className="relative">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your project..."
              className="pr-12"
              disabled={createAnswer.isPending}
              aria-label="Ask a question about your project"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              disabled={!question.trim() || createAnswer.isPending}
              aria-label="Submit question"
            >
              {createAnswer.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="w-4 h-4" aria-hidden="true" />
              )}
            </Button>
          </form>

          {/* Error message */}
          {createAnswer.isError && (
            <p className="text-sm text-red-600" role="alert">
              Failed to submit question. Please try again.
            </p>
          )}

          {/* Suggested question chips */}
          {!question && (
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Suggested questions"
            >
              {suggestedQuestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={createAnswer.isPending}
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full px-3 text-xs text-[hsl(var(--medium-grey))] hover:text-[hsl(var(--bold-royal-blue))]"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
