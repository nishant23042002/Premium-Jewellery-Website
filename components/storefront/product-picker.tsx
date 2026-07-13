"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Loader2, Search, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { listProducts } from "@/features/products/product.actions";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export interface PickedProduct {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

interface ProductPickerProps {
  selected: PickedProduct[];
  onChange: (products: PickedProduct[]) => void;
  max?: number;
}

/** Searchable multi-select for the Reservation form's "Product Selection" (Phase 6). */
export function ProductPicker({
  selected,
  onChange,
  max = 10,
}: ProductPickerProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<PickedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listProducts({ query: debouncedQuery, pageSize: 8 })
      .then((res) => {
        if (cancelled) return;
        setResults(
          res.items.map(({ product }) => ({
            id: product.id,
            name: product.name.en,
            slug: product.slug,
            imageUrl: product.images[0]?.url,
          })),
        );
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  function toggle(product: PickedProduct) {
    const isSelected = selected.some((p) => p.id === product.id);
    if (isSelected) {
      onChange(selected.filter((p) => p.id !== product.id));
    } else if (selected.length < max) {
      onChange([...selected, product]);
    }
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((product) => (
            <Badge key={product.id} variant="outline" className="gap-1 pr-1">
              {product.name}
              <button
                type="button"
                aria-label={`Remove ${product.name}`}
                onClick={() =>
                  onChange(selected.filter((p) => p.id !== product.id))
                }
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Command shouldFilter={false} className="rounded-lg border border-input">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <CommandInput
            placeholder="Search pieces to add..."
            value={query}
            onValueChange={setQuery}
            className="border-none"
          />
          {isLoading && (
            <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>
        <CommandList>
          <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
            {isLoading ? "Searching..." : "No products found."}
          </CommandEmpty>
          <CommandGroup>
            {results.map((product) => {
              const isSelected = selected.some((p) => p.id === product.id);
              return (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => toggle(product)}
                  className="gap-2"
                >
                  <div className="relative size-8 shrink-0 overflow-hidden rounded-md bg-muted">
                    {product.imageUrl && (
                      <Image
                        src={product.imageUrl}
                        alt=""
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <span className="flex-1 truncate">{product.name}</span>
                  <Check
                    className={cn(
                      "size-4",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
