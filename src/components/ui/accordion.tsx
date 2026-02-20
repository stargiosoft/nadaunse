"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "./utils";

type AccordionSize = "small" | "medium" | "large";

interface AccordionContextValue {
  size: AccordionSize;
}

const AccordionContext = React.createContext<AccordionContextValue>({
  size: "medium",
});

interface AccordionProps extends React.ComponentProps<typeof AccordionPrimitive.Root> {
  size?: AccordionSize;
}

function Accordion({
  size = "medium",
  ...props
}: AccordionProps) {
  return (
    <AccordionContext.Provider value={{ size }}>
      <AccordionPrimitive.Root data-slot="accordion" {...props} />
    </AccordionContext.Provider>
  );
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  const { size } = React.useContext(AccordionContext);

  const sizeStyles = {
    small: "py-2",
    medium: "py-3",
    large: "py-4",
  };

  const iconSize = {
    small: 12,
    medium: 16,
    large: 20,
  };

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-center justify-between gap-4 rounded-md outline-none disabled:pointer-events-none disabled:opacity-50",
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          size={iconSize[size]}
          className="shrink-0"
          style={{
            color: '#848484',
            transition: 'transform 200ms ease',
          }}
          data-slot="accordion-chevron"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

// CSS for chevron rotation - injected once
const styleId = 'accordion-chevron-style';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = '[data-state="open"] > [data-slot="accordion-chevron"] { transform: rotate(180deg); }';
  document.head.appendChild(style);
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  const { size } = React.useContext(AccordionContext);

  const contentPaddingStyles = {
    small: "pb-2",
    medium: "pb-3",
    large: "pb-4",
  };

  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden"
      {...props}
    >
      <div className={cn("pt-0", contentPaddingStyles[size], className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
