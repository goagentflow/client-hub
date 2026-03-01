import { useState } from "react";
import { Copy, Send, Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import type { Questionnaire } from "@/types";
import { copyTextToClipboard } from "@/lib/clipboard";

interface QuestionnaireShareTabProps {
  questionnaire: Questionnaire;
}

export function QuestionnaireShareTab({ questionnaire: q }: QuestionnaireShareTabProps) {
  const [additionalEmails, setAdditionalEmails] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const handleCopyLink = () => {
    void copyTextToClipboard(q.formUrl);
  };

  const toggleContact = (userId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-[hsl(var(--dark-grey))] mb-4">Copy Link</h3>
        <div className="flex gap-2">
          <Input value={q.formUrl} readOnly className="flex-1" />
          <Button variant="outline" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
        <p className="text-sm text-[hsl(var(--medium-grey))] mt-2">Anyone with this link can complete the form</p>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-[hsl(var(--dark-grey))] mb-4">Send via Email</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[hsl(var(--dark-grey))] block mb-2">
              Send to client contacts
            </label>
            <div className="space-y-2">
              {q.completions.map((completion) => (
                <div key={completion.userId} className="flex items-center gap-2">
                  <Checkbox
                    id={completion.userId}
                    checked={selectedContacts.includes(completion.userId)}
                    onCheckedChange={() => toggleContact(completion.userId)}
                  />
                  <label htmlFor={completion.userId} className="text-sm text-[hsl(var(--dark-grey))]">
                    {completion.userName} ({completion.userEmail})
                    {completion.completedAt && (
                      <span className="text-[hsl(var(--medium-grey))] ml-2">- Already completed</span>
                    )}
                  </label>
                </div>
              ))}
              {q.completions.length === 0 && (
                <p className="text-sm text-[hsl(var(--medium-grey))]">No client contacts added yet</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--dark-grey))] block mb-2">
              Add email addresses
            </label>
            <Input
              placeholder="email@example.com"
              value={additionalEmails}
              onChange={(e) => setAdditionalEmails(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--dark-grey))] block mb-2">
              Personal message (optional)
            </label>
            <Textarea
              placeholder="Add a personal message..."
              rows={4}
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
            />
          </div>
          <Button className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white">
            <Send className="w-4 h-4 mr-2" />
            Send Invite
          </Button>
          <p className="text-sm text-[hsl(var(--medium-grey))]">Invitation sent via Outlook</p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-[hsl(var(--dark-grey))] mb-4">Client Hub</h3>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium text-[hsl(var(--dark-grey))]">Show in client hub</p>
            <p className="text-sm text-[hsl(var(--medium-grey))]">
              Clients can see and complete this questionnaire in their hub
            </p>
            {q.completions.length > 0 && (
              <p className="text-sm text-[hsl(var(--medium-grey))] mt-1">
                Currently visible to: {q.completions.map((c) => c.userName).join(", ")}
              </p>
            )}
          </div>
          <Switch defaultChecked={q.status === "active"} />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-[hsl(var(--dark-grey))] mb-4">QR Code</h3>
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 bg-muted rounded flex items-center justify-center">
            <QrCode className="w-16 h-16 text-[hsl(var(--medium-grey))]" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-[hsl(var(--medium-grey))] mb-3">
              Useful for in-person workshops and events
            </p>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-[hsl(var(--dark-grey))] mb-4">Distribution Tracking</h3>
        <div className="space-y-2 text-sm">
          <p className="text-[hsl(var(--dark-grey))]">Sent to {q.completions.length} people via email</p>
          <p className="text-[hsl(var(--dark-grey))]">{q.responseCount} completions</p>
        </div>
      </Card>
    </div>
  );
}
