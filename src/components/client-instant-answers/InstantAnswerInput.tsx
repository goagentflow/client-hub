/**
 * Instant Answer Input - Question input with suggested question chips
 */

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface InstantAnswerInputProps {
  onSubmit: (question: string) => void;
  isSubmitting?: boolean;
  disabled?: boolean;
}

const suggestedQuestions = [
  "What's the project status?",
  "When is the next milestone?",
  "What decisions are pending?",
  "When is our next meeting?",
];

export function InstantAnswerInput({
  onSubmit,
  isSubmitting = false,
  disabled = false,
}: InstantAnswerInputProps) {
  const [question, setQuestion] = useState("");

  const handleSubmit = () => {
    const trimmed = question.trim();
    if (trimmed && !isSubmitting && !disabled) {
      onSubmit(trimmed);
      setQuestion("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isSubmitting && !disabled) {
      onSubmit(suggestion);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about your project..."
          className="pr-12 min-h-[80px] resize-none"
          disabled={isSubmitting || disabled}
        />
        <Button
          size="icon"
          className="absolute bottom-2 right-2"
          onClick={handleSubmit}
          disabled={!question.trim() || isSubmitting || disabled}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {!question && (
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isSubmitting || disabled}
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
  );
}
