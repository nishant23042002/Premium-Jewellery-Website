"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EnquiryForm } from "@/components/storefront/enquiry-form";

export function ProductEnquiryDialog({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline-gold" size="lg" className="flex-1">
            <MessageSquare className="size-4" />
            Enquire
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enquire about {productName}</DialogTitle>
        </DialogHeader>
        <EnquiryForm productId={productId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
