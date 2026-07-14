"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { updateCustomerNotes } from "@/features/customers/customer.actions";
import { toast } from "@/lib/toast";

interface CustomerNotesFormProps {
  customerId: string;
  initialNotes?: string;
  initialTags: string[];
}

export function CustomerNotesForm({
  customerId,
  initialNotes,
  initialTags,
}: CustomerNotesFormProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [tags, setTags] = useState(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function addTag() {
    const value = tagInput.trim();
    if (value && !tags.includes(value)) setTags([...tags, value]);
    setTagInput("");
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const result = await updateCustomerNotes(customerId, { notes, tags });
      if (!result.success) {
        toast.error("Couldn't save", result.error);
        return;
      }
      toast.success("Saved");
    } catch {
      toast.error("Couldn't save", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                aria-label={`Remove tag ${tag}`}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag (e.g. VIP, bridal)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Staff notes</Label>
        <Textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything staff should remember about this customer..."
        />
      </div>

      <Button variant="gold" size="sm" disabled={isSaving} onClick={handleSave}>
        {isSaving && <Loader2 className="size-3.5 animate-spin" />}
        Save
      </Button>
    </div>
  );
}
