import { useEffect } from "react";
import { useProductTour, TourStepInfo } from "./ProductTourProvider";

interface TourStepProps extends Omit<TourStepInfo, "path"> {}

export const TourStep: React.FC<TourStepProps> = ({
  id,
  title,
  content,
  targetId,
}) => {
  const { registerStep } = useProductTour();
  const path = window.location.pathname;

  useEffect(() => {
    registerStep({ id, title, content, targetId, path });
  }, [id, title, content, targetId, path, registerStep]);

  return null;
};