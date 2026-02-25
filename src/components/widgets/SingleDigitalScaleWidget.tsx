"use client";

import { useId } from "react";

import { SingleDigitalScaleConfig } from "@/lib/types";
import {
  computeDigitalScaleLayout,
  DIGITAL_SCALE_VIEWBOX_HEIGHT,
  DIGITAL_SCALE_VIEWBOX_WIDTH,
  DigitalScaleChassis,
  DigitalScaleWeightGlyph,
  expandShapeGroups,
  expandWeightGroups,
  renderScaleShape,
  resolveDisplayText,
  safeNumber
} from "@/components/widgets/digitalScaleShared";

interface SingleDigitalScaleWidgetProps {
  config: SingleDigitalScaleConfig;
}

// Static visual widget: this does not do answer selection or grading.
export default function SingleDigitalScaleWidget({ config }: SingleDigitalScaleWidgetProps) {
  const gradientIdSeed = useId().replace(/:/g, "-");
  const plateGradientId = `metal-plate-${gradientIdSeed}`;
  const bodyGradientId = `metal-body-${gradientIdSeed}`;

  const safeScaleValue = safeNumber(config.scaleDisplayValue);
  const displayText = resolveDisplayText(safeScaleValue, config.scaleDisplayText);
  const shapes = expandShapeGroups(config.shapeGroups);
  const weights = expandWeightGroups(config.weightGroups ?? []);
  const layout = computeDigitalScaleLayout(
    shapes.length,
    weights.map((weight) => weight.label)
  );

  const maxWidth = Number.isFinite(config.layout.maxWidth) ? Math.max(220, config.layout.maxWidth) : 420;

  return (
    <div className="mx-auto w-full" style={{ maxWidth }}>
      <svg
        viewBox={`0 0 ${DIGITAL_SCALE_VIEWBOX_WIDTH} ${DIGITAL_SCALE_VIEWBOX_HEIGHT}`}
        width="100%"
        style={{ height: "auto" }}
        role="img"
        aria-label="Single digital scale visualization"
      >
        <DigitalScaleChassis plateGradientId={plateGradientId} bodyGradientId={bodyGradientId} displayText={displayText} />

        {shapes.map((shape, index) => {
          return renderScaleShape(shape, index, layout.shapeCenters[index], layout.shapeSize, layout.groundY);
        })}

        {weights.map((weight, index) => (
          <DigitalScaleWeightGlyph
            key={`weight-${index}`}
            centerX={layout.weightCenters[index]}
            centerY={layout.groundY - layout.weightWidths[index] * 0.6}
            width={layout.weightWidths[index]}
            fill={weight.fill}
            label={weight.label}
          />
        ))}
      </svg>
    </div>
  );
}
