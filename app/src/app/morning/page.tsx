"use client";

import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { theme } from "../../lib/theme";

const morningSteps = [
  {
    title: "Brush Teeth",
    detail: "Philips Sonicare + toothpaste",
    time: "2 minutes",
  },
  {
    title: "Dental Floss",
    detail: "Use regular dental floss",
    time: "1 minute",
  },
  {
    title: "Tongue Scraper",
    detail: "2–4 gentle passes",
    time: "30 seconds",
  },
  {
    title: "Oral Rinse",
    detail: "Equate Healthy Gums Oral Rinse",
    time: "30 seconds",
  },
  {
    title: "Foaming Cleanser",
    detail: "Wash face with CeraVe Foaming Facial Cleanser",
    time: "1 minute",
  },
  {
    title: "Eye Repair Cream",
    detail: "Small amount under each eye",
    time: "30 seconds",
  },
  {
    title: "AM Moisturizer SPF 30",
    detail: "CeraVe AM Facial Moisturizing Lotion",
    time: "1 minute",
  },
  {
    title: "Lip Balm",
    detail: "Aquaphor Lip Repair",
    time: "As needed",
  },
];

export default function MorningRoutine() {
  const [currentStep, setCurrentStep] = useState(0);

  const step = morningSteps[currentStep];
  const isLastStep = currentStep === morningSteps.length - 1;

  function handleNextStep() {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  }

  return (
    <main
      className="min-h-screen p-6"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="mx-auto max-w-md">
        <header className="pt-6">
          <p className="text-lg" style={{ color: theme.colors.textSecondary }}>
            Morning Routine
          </p>

          <h1
            className="mt-1 text-4xl font-bold tracking-tight"
            style={{ color: theme.colors.textPrimary }}
          >
            {step.title}
          </h1>

          <p className="mt-3 text-sm" style={{ color: theme.colors.textSecondary }}>
            Step {currentStep + 1} of {morningSteps.length}
          </p>
        </header>

        <div className="mt-8">
          <Card>
            <p className="text-base" style={{ color: theme.colors.textSecondary }}>
              {step.detail}
            </p>

            <p className="mt-4 text-base" style={{ color: theme.colors.textSecondary }}>
              Estimated time: {step.time}
            </p>

            <div className="mt-8">
              <Button onClick={handleNextStep}>
                {isLastStep ? "Morning Complete" : "Done"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}