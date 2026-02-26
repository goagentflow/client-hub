/**
 * PortalContactsCard — staff UI for managing portal email contacts and access method.
 *
 * Shows: access method toggle, contact list with add/remove, inline add form.
 */

import { useState } from "react";
import { Mail, Plus, Trash2, Shield, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  usePortalContacts,
  useAccessMethod,
  useAddPortalContact,
  useRemovePortalContact,
  useUpdateAccessMethod,
} from "@/hooks/use-portal-contacts";
import { useToast } from "@/hooks/use-toast";
import type { AccessMethod } from "@/services/portal-contacts.service";

interface PortalContactsCardProps {
  hubId: string;
}

const ACCESS_OPTIONS: { value: AccessMethod; label: string; icon: typeof Mail; desc: string }[] = [
  { value: "email", label: "Email Verification", icon: Mail, desc: "Clients verify via email code" },
  { value: "password", label: "Password", icon: Lock, desc: "Shared password for all clients" },
  { value: "open", label: "Open Access", icon: Globe, desc: "Anyone with the link can view" },
];

export function PortalContactsCard({ hubId }: PortalContactsCardProps) {
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const { data: contacts = [], isLoading: loadingContacts } = usePortalContacts(hubId);
  const { data: accessMethod, isLoading: loadingMethod } = useAccessMethod(hubId);
  const { mutate: addContact, isPending: isAdding } = useAddPortalContact(hubId);
  const { mutate: removeContact } = useRemovePortalContact(hubId);
  const { mutate: setMethod } = useUpdateAccessMethod(hubId);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    addContact({ email, name: newName.trim() || undefined }, {
      onSuccess: () => {
        toast({
          title: "Contact added",
          description: `${email} can now access this portal.`,
        });
        setNewEmail("");
        setNewName("");
        setShowAddForm(false);
      },
      onError: (err) => {
        const apiErr = err as { status?: number; message?: string };
        if (apiErr.status === 409) {
          toast({
            title: "Contact already exists",
            description: `${email} already has access to this hub.`,
          });
          return;
        }
        toast({
          title: "Could not add contact",
          description: apiErr.message ?? "Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const isEmailMode = accessMethod === "email";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[hsl(var(--dark-grey))] flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Portal Access
        </CardTitle>
        <CardDescription>Control how clients access this portal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Access method selector */}
        {!loadingMethod && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[hsl(var(--dark-grey))]">Access Method</p>
            <div className="grid grid-cols-3 gap-2">
              {ACCESS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = accessMethod === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMethod(opt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 active:translate-y-px ${
                      isActive
                        ? "border-[hsl(var(--royal-blue))] bg-[hsl(var(--royal-blue))]/10"
                        : "border-gray-200 bg-white hover:border-[hsl(var(--royal-blue))]/40 hover:bg-[hsl(var(--royal-blue))]/5"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-[hsl(var(--royal-blue))]" : "text-[hsl(var(--medium-grey))]"}`} />
                    <span className={`text-xs font-medium ${isActive ? "text-[hsl(var(--royal-blue))]" : "text-[hsl(var(--dark-grey))]"}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[hsl(var(--medium-grey))]">
              {ACCESS_OPTIONS.find((o) => o.value === accessMethod)?.desc}
            </p>
          </div>
        )}

        {/* Contact list — only relevant for email mode */}
        {isEmailMode && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[hsl(var(--dark-grey))]">
                Authorised Contacts ({contacts.length})
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-[hsl(var(--gradient-blue))]"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>

            {/* Add form */}
            {showAddForm && (
              <form onSubmit={handleAdd} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <Input
                  type="email"
                  placeholder="client@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                />
                <Input
                  type="text"
                  placeholder="Name (optional)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-9 text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isAdding || !newEmail.trim()}
                  >
                    {isAdding ? "Adding..." : "Add Contact"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Contacts */}
            {loadingContacts ? (
              <p className="text-sm text-[hsl(var(--medium-grey))] text-center py-3">Loading...</p>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-[hsl(var(--medium-grey))] text-center py-3">
                No contacts added yet. Add emails of clients who should have access.
              </p>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="min-w-0">
                      {contact.name && (
                        <p className="text-sm font-medium text-[hsl(var(--dark-grey))] truncate">{contact.name}</p>
                      )}
                      <p className="text-sm text-[hsl(var(--medium-grey))] truncate">{contact.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive/80 shrink-0"
                      onClick={() => removeContact(contact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
