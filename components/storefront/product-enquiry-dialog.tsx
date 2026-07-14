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
  productImageUrl,
  productSkuCode,
}: {
  productId: string;
  productName: string;
  productImageUrl?: string;
  productSkuCode?: string;
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
        <EnquiryForm
          productId={productId}
          productName={productName}
          productImageUrl={productImageUrl}
          defaultMessage={
            productSkuCode
              ? `Hi, I'm interested in "${productName}" (SKU: ${productSkuCode}). Could you share more details on availability and pricing?`
              : `Hi, I'm interested in "${productName}". Could you share more details on availability and pricing?`
          }
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
