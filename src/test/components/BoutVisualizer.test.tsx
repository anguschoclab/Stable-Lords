import { render, screen, fireEvent, act } from "@testing-library/react";
import { BoutVisualizer } from "@/components/BoutVisualizer";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@testing-library/jest-dom";

describe("BoutVisualizer", () => {
  const mockLog = [
    { minute: 1, text: "The fight begins!", events: [] },
    { 
      minute: 2, 
      text: "A devastating blow!", 
      events: [{ type: "HIT", actor: "A", target: "D", value: 15, metadata: { critical: true } }] 
    },
    { minute: 3, text: "D is wobbling...", events: [] },
  ];

  it("renders the initial state", () => {
    render(
      <TooltipProvider>
        <BoutVisualizer 
          nameA="Warrior A" 
          nameD="Warrior D" 
          styleA="Slasher" 
          styleD="Basher" 
          log={mockLog as any}
          winner="A" 
          by="KO" 
        />
      </TooltipProvider>
    );
    expect(screen.getByText("Warrior A")).toBeInTheDocument();
    expect(screen.getByText("Warrior D")).toBeInTheDocument();
  });

  it("renders critical strike animations/indicators", async () => {
    render(
      <TooltipProvider>
        <BoutVisualizer 
          nameA="Warrior A" 
          nameD="Warrior D" 
          styleA="Slasher" 
          styleD="Basher" 
          log={mockLog as any}
          winner="A" 
          by="KO" 
        />
      </TooltipProvider>
    );
    
    // Skip to end or advance manually
    const skipButton = screen.getByLabelText(/skip/i);
    fireEvent.click(skipButton);

    // Should find evidence of the critical hit (e.g., a specific icon or text)
    expect(screen.getByTestId("event-crit-icon")).toBeInTheDocument();
  });
});
