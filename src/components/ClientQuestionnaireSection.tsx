import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Share2, CheckCircle2, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type QuestionnaireStatus = "not-started" | "in-progress" | "completed";

interface Questionnaire {
  id: string;
  title: string;
  description: string;
  status: QuestionnaireStatus;
  totalQuestions: number;
  completedQuestions?: number;
  completedDate?: string;
  estimatedMinutes?: number;
}

export const ClientQuestionnaireSection = () => {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [currentView, setCurrentView] = useState<"list" | "completing" | "confirmation" | "responses">("list");
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [showCompletion, setShowCompletion] = useState(false);
  const { toast } = useToast();

  const questionnaires: Questionnaire[] = [
    {
      id: "1",
      title: "AI Readiness Assessment",
      description: "Tell us about your current AI maturity and priorities",
      status: "not-started",
      totalQuestions: 10,
      estimatedMinutes: 5,
    },
    {
      id: "2",
      title: "Discovery: Daily Tasks Survey",
      description: "Understanding what team members do day-to-day",
      status: "completed",
      totalQuestions: 8,
      completedDate: "Nov 22",
    },
    {
      id: "3",
      title: "Sprint Feedback Survey",
      description: "Share your feedback on the Copilot sprint",
      status: "in-progress",
      totalQuestions: 12,
      completedQuestions: 5,
    },
  ];

  const getStatusBadge = (status: QuestionnaireStatus) => {
    switch (status) {
      case "not-started":
        return <Badge className="bg-amber-500 text-white hover:bg-amber-600">Not Started</Badge>;
      case "in-progress":
        return <Badge className="bg-[hsl(var(--gradient-blue))] text-white">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-[hsl(var(--sage-green))] text-white">Completed</Badge>;
    }
  };

  const handleShare = () => {
    if (!shareEmail || !shareEmail.endsWith("@neverlandcreative.com")) {
      toast({
        title: "Invalid email",
        description: "Please enter a @neverlandcreative.com email address",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Invitation sent",
      description: `Questionnaire shared with ${shareEmail}`,
    });
    setShareOpen(false);
    setShareEmail("");
    setShareMessage("");
  };

  const copyLink = () => {
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    });
  };

  const startQuestionnaire = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    if (questionnaire.status === "in-progress") {
      setCurrentQuestion(questionnaire.completedQuestions || 1);
    } else {
      setCurrentQuestion(1);
    }
    setCurrentView("completing");
  };

  const viewResponses = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setCurrentView("responses");
  };

  const handleNext = () => {
    if (selectedQuestionnaire && currentQuestion < selectedQuestionnaire.totalQuestions) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setCurrentView("confirmation");
  };

  const saveAndExit = () => {
    toast({
      title: "Progress saved",
      description: "You can continue later from where you left off",
    });
    setCurrentView("list");
    setSelectedQuestionnaire(null);
  };

  if (currentView === "completing" && selectedQuestionnaire) {
    const progress = (currentQuestion / selectedQuestionnaire.totalQuestions) * 100;
    const isLastQuestion = currentQuestion === selectedQuestionnaire.totalQuestions;

    return (
      <div className="min-h-screen bg-[hsl(var(--warm-cream))] p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-[hsl(var(--dark-grey))] mb-2">{selectedQuestionnaire.title}</h1>
                <p className="text-sm text-[hsl(var(--medium-grey))]">
                  Question {currentQuestion} of {selectedQuestionnaire.totalQuestions}
                </p>
              </div>
              <Button variant="link" onClick={saveAndExit} className="text-[hsl(var(--medium-grey))]">
                Save & Exit
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            {currentQuestion === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold text-[hsl(var(--dark-grey))] mb-4 block">
                    How would you rate your organization's current AI maturity?
                  </Label>
                  <RadioGroup defaultValue="">
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value="early" id="early" />
                      <Label htmlFor="early" className="font-normal cursor-pointer">Early Stage - Just beginning to explore AI</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value="developing" id="developing" />
                      <Label htmlFor="developing" className="font-normal cursor-pointer">Developing - Some AI projects in progress</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value="established" id="established" />
                      <Label htmlFor="established" className="font-normal cursor-pointer">Established - AI integrated in several areas</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value="advanced" id="advanced" />
                      <Label htmlFor="advanced" className="font-normal cursor-pointer">Advanced - AI-driven across the organization</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {currentQuestion === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold text-[hsl(var(--dark-grey))] mb-4 block">
                    What's the biggest challenge you face day-to-day?
                  </Label>
                  <Textarea
                    placeholder="Describe your main challenge..."
                    className="min-h-32"
                  />
                </div>
              </div>
            )}

            {currentQuestion === 3 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold text-[hsl(var(--dark-grey))] mb-4 block">
                    What's your top priority for AI implementation?
                  </Label>
                  <RadioGroup defaultValue="">
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value="automate" id="automate" />
                      <Label htmlFor="automate" className="font-normal cursor-pointer">Automate repetitive admin tasks</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer" className="font-normal cursor-pointer">Improve customer service</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value="analysis" id="analysis" />
                      <Label htmlFor="analysis" className="font-normal cursor-pointer">Better data analysis and reporting</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value="creative" id="creative" />
                      <Label htmlFor="creative" className="font-normal cursor-pointer">Enhance creative workflows</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {currentQuestion === 4 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold text-[hsl(var(--dark-grey))] mb-4 block">
                    How satisfied are you with your current tools? (Rate 1-5)
                  </Label>
                  <RadioGroup defaultValue="" className="flex gap-8 mt-4">
                    <div className="flex flex-col items-center space-y-2">
                      <RadioGroupItem value="1" id="rating-1" />
                      <Label htmlFor="rating-1" className="font-normal text-sm">Very<br/>Dissatisfied</Label>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <RadioGroupItem value="2" id="rating-2" />
                      <Label htmlFor="rating-2" className="font-normal text-sm">Dissatisfied</Label>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <RadioGroupItem value="3" id="rating-3" />
                      <Label htmlFor="rating-3" className="font-normal text-sm">Neutral</Label>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <RadioGroupItem value="4" id="rating-4" />
                      <Label htmlFor="rating-4" className="font-normal text-sm">Satisfied</Label>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <RadioGroupItem value="5" id="rating-5" />
                      <Label htmlFor="rating-5" className="font-normal text-sm">Very<br/>Satisfied</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {currentQuestion === 5 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold text-[hsl(var(--dark-grey))] mb-4 block">
                    Which areas interest you most? (Select all that apply)
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="workflow" />
                      <Label htmlFor="workflow" className="font-normal cursor-pointer">Workflow automation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="customer-support" />
                      <Label htmlFor="customer-support" className="font-normal cursor-pointer">Customer support AI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="analytics" />
                      <Label htmlFor="analytics" className="font-normal cursor-pointer">Predictive analytics</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="content" />
                      <Label htmlFor="content" className="font-normal cursor-pointer">Content generation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="data-processing" />
                      <Label htmlFor="data-processing" className="font-normal cursor-pointer">Data processing</Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentQuestion > 5 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold text-[hsl(var(--dark-grey))] mb-4 block">
                    Question {currentQuestion}: Additional feedback
                  </Label>
                  <Textarea
                    placeholder="Your answer..."
                    className="min-h-32"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            {!isLastQuestion ? (
              <Button
                onClick={handleNext}
                className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90"
              >
                Submit
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "confirmation") {
    return (
      <div className="min-h-screen bg-[hsl(var(--warm-cream))] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-[hsl(var(--sage-green))] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[hsl(var(--dark-grey))] mb-2">Thank you!</h1>
          <p className="text-[hsl(var(--medium-grey))] mb-6">Your responses have been submitted</p>
          <div className="space-y-3">
            <Button
              onClick={() => viewResponses(selectedQuestionnaire!)}
              variant="outline"
              className="w-full"
            >
              View Your Responses
            </Button>
            <Button
              onClick={() => {
                setCurrentView("list");
                setSelectedQuestionnaire(null);
              }}
              className="w-full bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90"
            >
              Return to Questionnaires
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "responses" && selectedQuestionnaire) {
    return (
      <div className="p-8">
        <Button
          variant="ghost"
          onClick={() => {
            setCurrentView("list");
            setSelectedQuestionnaire(null);
          }}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questionnaires
        </Button>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[hsl(var(--dark-grey))] mb-2">
                Your Responses: {selectedQuestionnaire.title}
              </h1>
              <p className="text-sm text-[hsl(var(--medium-grey))]">Submitted {selectedQuestionnaire.completedDate}</p>
            </div>

            <div className="space-y-6">
              <div className="border-b pb-4">
                <p className="font-semibold text-[hsl(var(--dark-grey))] mb-2">
                  Q1: How would you rate your organization's current AI maturity?
                </p>
                <p className="text-[hsl(var(--medium-grey))]">Early Stage - Just beginning to explore AI</p>
              </div>
              <div className="border-b pb-4">
                <p className="font-semibold text-[hsl(var(--dark-grey))] mb-2">
                  Q2: What's the biggest challenge you face day-to-day?
                </p>
                <p className="text-[hsl(var(--medium-grey))]">
                  Managing multiple tools and platforms without proper integration. Data is siloed across different systems.
                </p>
              </div>
              <div className="border-b pb-4">
                <p className="font-semibold text-[hsl(var(--dark-grey))] mb-2">
                  Q3: What's your top priority for AI implementation?
                </p>
                <p className="text-[hsl(var(--medium-grey))]">Automate repetitive admin tasks</p>
              </div>
              <div className="border-b pb-4">
                <p className="font-semibold text-[hsl(var(--dark-grey))] mb-2">
                  Q4: How satisfied are you with your current tools? (Rate 1-5)
                </p>
                <p className="text-[hsl(var(--medium-grey))]">3 - Neutral</p>
              </div>
              <div className="pb-4">
                <p className="font-semibold text-[hsl(var(--dark-grey))] mb-2">
                  Q5: Which areas interest you most?
                </p>
                <p className="text-[hsl(var(--medium-grey))]">Workflow automation, Predictive analytics, Data processing</p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                onClick={() => {
                  setCurrentView("list");
                  setSelectedQuestionnaire(null);
                }}
                className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90"
              >
                Return to Questionnaires
              </Button>
              <Button variant="outline">Download as PDF</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))] mb-2">Questionnaires</h1>
        <p className="text-[hsl(var(--medium-grey))]">Help us understand your needs</p>
      </div>

      {/* Questionnaire List */}
      <div className="space-y-4 max-w-4xl">
        {questionnaires.map((questionnaire) => (
          <div key={questionnaire.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[hsl(var(--dark-grey))] mb-2">{questionnaire.title}</h3>
                <p className="text-[hsl(var(--medium-grey))] mb-3">{questionnaire.description}</p>
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--medium-grey))]">
                  {questionnaire.status === "not-started" && (
                    <span>{questionnaire.totalQuestions} questions · ~{questionnaire.estimatedMinutes} minutes</span>
                  )}
                  {questionnaire.status === "completed" && (
                    <span>{questionnaire.totalQuestions} questions · Completed {questionnaire.completedDate}</span>
                  )}
                  {questionnaire.status === "in-progress" && (
                    <div className="space-y-2 w-full">
                      <span>{questionnaire.completedQuestions} of {questionnaire.totalQuestions} questions completed</span>
                      <Progress
                        value={((questionnaire.completedQuestions || 0) / questionnaire.totalQuestions) * 100}
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2 ml-4">
                {getStatusBadge(questionnaire.status)}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedQuestionnaire(questionnaire);
                    setShareOpen(true);
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              {questionnaire.status === "not-started" && (
                <Button
                  onClick={() => startQuestionnaire(questionnaire)}
                  className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90"
                >
                  Start
                </Button>
              )}
              {questionnaire.status === "in-progress" && (
                <Button
                  onClick={() => startQuestionnaire(questionnaire)}
                  className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90"
                >
                  Continue
                </Button>
              )}
              {questionnaire.status === "completed" && (
                <>
                  <Button variant="outline" onClick={() => viewResponses(questionnaire)}>
                    View Your Responses
                  </Button>
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--sage-green))]" />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Share Modal */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Questionnaire</DialogTitle>
            <p className="text-sm text-[hsl(var(--medium-grey))]">Invite a colleague to complete this questionnaire</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-email">Colleague's email</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="colleague@neverlandcreative.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
              <p className="text-xs text-[hsl(var(--medium-grey))]">Share with people at @neverlandcreative.com</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-message">Add a message (optional)</Label>
              <Textarea
                id="share-message"
                placeholder="Hi, please complete this survey for the AgentFlow project..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyLink} className="flex-1">
                Copy Link
              </Button>
            </div>
            <p className="text-xs text-[hsl(var(--medium-grey))]">Your colleague will need to sign in to complete</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShareOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare} className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90">
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
