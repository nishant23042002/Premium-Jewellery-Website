"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  addAddress,
  removeAddress,
} from "@/features/customer-auth/customer-auth.actions";
import {
  addressFormSchema,
  type AddressFormInput,
} from "@/features/customer-auth/customer-account.schema";
import { toast } from "@/lib/toast";
import type { Address } from "@/features/customer-auth/customer-account.types";

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(addresses.length === 0);

  const form = useForm<AddressFormInput>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      label: "Home",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: addresses.length === 0,
    },
  });

  async function onSubmit(values: AddressFormInput) {
    const result = await addAddress(values);
    if (!result.success) {
      toast.error("Couldn't save address", result.error);
      return;
    }
    toast.success("Address saved");
    form.reset();
    setShowForm(false);
    router.refresh();
  }

  async function handleRemove(addressId: string) {
    const result = await removeAddress(addressId);
    if (!result.success) {
      toast.error("Couldn't remove address", result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <Card key={address.id} className="border-border/60">
          <CardContent className="flex items-start justify-between gap-4 pt-2">
            <div className="flex gap-3">
              <MapPin
                className="mt-0.5 size-5 shrink-0 text-gold"
                strokeWidth={1.5}
              />
              <div className="text-sm">
                <p className="font-medium">
                  {address.label}
                  {address.isDefault && (
                    <span className="ml-2 text-xs text-gold-dark">Default</span>
                  )}
                </p>
                <p className="text-muted-foreground">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                  {address.state} - {address.pincode}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleRemove(address.id)}
              aria-label="Remove address"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}

      {showForm ? (
        <Card className="border-border/60">
          <CardContent className="pt-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Home" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="line1"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Address line 1</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="line2"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Address line 2 (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                      <FormLabel>Set as default address</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="gold"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    Save Address
                  </Button>
                  {addresses.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
        >
          <Plus className="size-3.5" />
          Add Address
        </Button>
      )}
    </div>
  );
}
