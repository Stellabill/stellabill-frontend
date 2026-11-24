import { useEffect, useState } from "react";
import type {
  CopyStatus,
  DeliveryMethod,
  GiftFormErrors,
  PurchaseStep,
} from "./giftPurchaseTypes";

export function useGiftPurchaseState(isOpen: boolean) {
  const [step, setStep] = useState<PurchaseStep>("details");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [duration, setDuration] = useState(12);
  const [message, setMessage] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("email");
  const [errors, setErrors] = useState<GiftFormErrors>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [giftCode, setGiftCode] = useState("");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("details");
        setRecipientName("");
        setRecipientEmail("");
        setDuration(12);
        setMessage("");
        setDeliveryMethod("email");
        setErrors({});
        setIsProcessing(false);
        setGiftCode("");
        setCopyStatus("idle");
      }, 300);
    }
  }, [isOpen]);

  return {
    step,
    setStep,
    recipientName,
    setRecipientName,
    recipientEmail,
    setRecipientEmail,
    duration,
    setDuration,
    message,
    setMessage,
    deliveryMethod,
    setDeliveryMethod,
    errors,
    setErrors,
    isProcessing,
    setIsProcessing,
    giftCode,
    setGiftCode,
    copyStatus,
    setCopyStatus,
  };
}
