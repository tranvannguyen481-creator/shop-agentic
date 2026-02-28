import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../../shared/components/ui";
import {
  EventCreationStepPath,
  getEventStepMeta,
} from "../../constants/event-step-flow";

interface EventStepNavigationProps {
  currentPath: EventCreationStepPath;
  nextType?: "button" | "submit";
  onNextClick?: () => void;
  className?: string;
}

function EventStepNavigation({
  currentPath,
  nextType = "button",
  onNextClick,
  className,
}: EventStepNavigationProps) {
  const navigate = useNavigate();
  const stepMeta = useMemo(() => getEventStepMeta(currentPath), [currentPath]);

  const handleLeftAction = () => {
    navigate(stepMeta.leftPath);
  };

  const handleNextAction = () => {
    if (onNextClick) {
      onNextClick();
      return;
    }

    if (nextType === "button" && stepMeta.nextPath) {
      navigate(stepMeta.nextPath);
    }
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        fullWidth
        onClick={handleLeftAction}
      >
        {stepMeta.leftLabel}
      </Button>
      <Button
        type={nextType}
        fullWidth
        onClick={nextType === "button" ? handleNextAction : undefined}
      >
        {stepMeta.rightLabel}
      </Button>
    </div>
  );
}

export default EventStepNavigation;
