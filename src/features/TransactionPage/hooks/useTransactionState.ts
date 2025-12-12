import { useState, useRef, useEffect } from "react";
import type { Transaction, Bike } from "../../../model";

interface UseTransactionStateProps {
  transactionData?: Transaction;
  searchParams: URLSearchParams;
}

interface UseTransactionStateReturn {
  // Bike state
  bike: Bike;
  setBike: (bike: Bike) => void;

  // Transaction type
  transactionType: string;
  setTransactionType: (type: string) => void;

  // UI state
  showCheckout: boolean;
  setShowCheckout: (show: boolean) => void;
  showBikeForm: boolean;
  setShowBikeForm: (show: boolean) => void;
  showWaitingParts: boolean;
  setShowWaitingParts: (show: boolean) => void;

  // Transaction flags
  refurb: boolean | undefined;
  setIsRefurb: (refurb: boolean | undefined) => void;
  reserved: boolean;
  waitEmail: boolean;
  setWaitEmail: (wait: boolean) => void;
  waitPart: boolean | undefined;
  setWaitPart: (wait: boolean | undefined) => void;
  priority: boolean | undefined;
  setPriority: (priority: boolean | undefined) => void;
  nuclear: boolean | undefined;
  setNuclear: (nuclear: boolean | undefined) => void;

  // Transaction details
  description: string | undefined;
  setDescription: (description: string | undefined) => void;
  isPaid: boolean;
  setPaid: (paid: boolean) => void;
  isCompleted: boolean | undefined;
  setIsCompleted: (completed: boolean | undefined) => void;
  beerBike: boolean | undefined;
  setBeerBike: (beerBike: boolean | undefined) => void;
  isEmployee: boolean;
  setIsEmployee: (employee: boolean) => void;

  // Pricing
  totalPrice: number;
  setTotalPrice: (price: number) => void;

  // Refs
  totalRef: React.RefObject<HTMLDivElement>;
  lastCheckedNetIdRef: React.RefObject<string | null>;
}

/**
 * Custom hook to manage all transaction-related state.
 * Centralizes state management for the TransactionPage component.
 *
 * @param transactionData - The transaction data from the API
 * @param searchParams - URL search parameters
 * @returns Object containing all state values and setters
 */
export const useTransactionState = ({
  transactionData,
  searchParams,
}: UseTransactionStateProps): UseTransactionStateReturn => {
  // Bike state
  const [bike, setBike] = useState<Bike>(null);

  // Transaction type from URL params or default
  const [transactionType, setTransactionType] = useState<string>(
    searchParams.get("type") ?? "",
  );

  // Pricing
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // UI modals/forms
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [showBikeForm, setShowBikeForm] = useState<boolean>(false);
  const [showWaitingParts, setShowWaitingParts] = useState<boolean>(false);

  // Transaction flags
  const [refurb, setIsRefurb] = useState<boolean | undefined>();
  const [reserved] = useState<boolean>(transactionData?.is_reserved ?? false);
  const [waitEmail, setWaitEmail] = useState<boolean>(
    transactionData?.is_waiting_on_email ?? false,
  );
  const [waitPart, setWaitPart] = useState<boolean | undefined>();
  const [priority, setPriority] = useState<boolean | undefined>();
  const [nuclear, setNuclear] = useState<boolean | undefined>();

  // Transaction details
  const [description, setDescription] = useState<string | undefined>();
  const [isPaid, setPaid] = useState<boolean>(
    transactionData?.is_paid ?? false,
  );
  const [isCompleted, setIsCompleted] = useState<boolean | undefined>();
  const [beerBike, setBeerBike] = useState<boolean | undefined>();
  const [isEmployee, setIsEmployee] = useState<boolean>(false);

  // Refs
  const totalRef = useRef<HTMLDivElement | null>(null);
  const lastCheckedNetIdRef = useRef<string | null>(null);

  // Sync state with transactionData when it changes
  useEffect(() => {
    if (transactionData) {
      setWaitEmail(transactionData.is_waiting_on_email);
      setPaid(transactionData.is_paid);
      setIsCompleted(transactionData.is_completed);
      setPriority(transactionData.is_urgent);
      setNuclear(transactionData.is_nuclear ?? undefined);
      // Note: is_waiting_on_part doesn't exist in schema, keep as undefined
      setBeerBike(transactionData.is_beer_bike);
      setIsRefurb(transactionData.is_refurb);
      setIsEmployee(transactionData.is_employee);
      setDescription(transactionData.description ?? "");
    }
  }, [transactionData]);

  return {
    // Bike state
    bike,
    setBike,

    // Transaction type
    transactionType,
    setTransactionType,

    // UI state
    showCheckout,
    setShowCheckout,
    showBikeForm,
    setShowBikeForm,
    showWaitingParts,
    setShowWaitingParts,

    // Transaction flags
    refurb,
    setIsRefurb,
    reserved,
    waitEmail,
    setWaitEmail,
    waitPart,
    setWaitPart,
    priority,
    setPriority,
    nuclear,
    setNuclear,

    // Transaction details
    description,
    setDescription,
    isPaid,
    setPaid,
    isCompleted,
    setIsCompleted,
    beerBike,
    setBeerBike,
    isEmployee,
    setIsEmployee,

    // Pricing
    totalPrice,
    setTotalPrice,

    // Refs
    totalRef,
    lastCheckedNetIdRef,
  };
};
