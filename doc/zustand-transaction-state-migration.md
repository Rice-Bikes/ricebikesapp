<file_path>
ricebikesapp/doc/zustand-transaction-state-migration.md
</file_path>

<edit_description>
Create a new document outlining the Zustand migration plan for TransactionPage.tsx
</edit_description>

# Migrating TransactionPage.tsx State Management to Zustand

Based on the current implementation in `TransactionPage.tsx`, which heavily relies on multiple `useState` hooks and `useEffect` hooks for managing transaction-related state, this document outlines how to refactor it using Zustand for centralized state management. This will simplify the component, reduce prop drilling, and make state updates more predictable.

## Current State Issues

The component currently uses ~15 `useState` hooks and several `useEffect` hooks that:
- Sync local state with server data
- Trigger transaction updates on state changes
- Handle complex interdependencies between states
- Lead to potential infinite loops or missed updates

## Proposed Zustand Store Structure

Create a new file: `src/stores/useTransactionStore.ts`

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import DBModel, {
  Bike,
  RepairDetails,
  ItemDetails,
  Part,
  Transaction,
  UpdateTransaction,
  User,
} from '../model';
import { queryClient } from '../app/queryClient';
import { toast } from 'react-toastify';

interface TransactionState {
  // Core state
  transaction: Transaction | null;
  transactionId: string;
  user: User;
  
  // UI state
  bike: Bike | null;
  transactionType: string;
  totalPrice: number;
  showCheckout: boolean;
  showBikeForm: boolean;
  showWaitingParts: boolean;
  
  // Transaction flags
  refurb: boolean;
  reserved: boolean;
  waitEmail: boolean;
  waitPart: boolean;
  priority: boolean;
  nuclear: boolean;
  description: string;
  isPaid: boolean;
  isCompleted: boolean;
  beerBike: boolean;
  isEmployee: boolean;
  
  // Data state
  repairDetails: RepairDetails[];
  itemDetails: ItemDetails[];
  orderRequestData: Part[];
  
  // Loading states
  isUpdating: boolean;
}

interface TransactionActions {
  // Initialization
  initializeTransaction: (transactionId: string, user: User) => void;
  setTransaction: (transaction: Transaction) => void;
  
  // State setters
  setBike: (bike: Bike | null) => void;
  setTransactionType: (type: string) => void;
  setTotalPrice: (price: number) => void;
  setShowCheckout: (show: boolean) => void;
  setShowBikeForm: (show: boolean) => void;
  setShowWaitingParts: (show: boolean) => void;
  
  // Flag setters
  setRefurb: (refurb: boolean) => void;
  setReserved: (reserved: boolean) => void;
  setWaitEmail: (wait: boolean) => void;
  setWaitPart: (wait: boolean) => void;
  setPriority: (priority: boolean) => void;
  setNuclear: (nuclear: boolean) => void;
  setDescription: (desc: string) => void;
  setPaid: (paid: boolean) => void;
  setCompleted: (completed: boolean) => void;
  setBeerBike: (beer: boolean) => void;
  setEmployee: (employee: boolean) => void;
  
  // Data setters
  setRepairDetails: (details: RepairDetails[]) => void;
  setItemDetails: (details: ItemDetails[]) => void;
  setOrderRequestData: (data: Part[]) => void;
  
  // Computed actions
  updateTransaction: () => Promise<void>;
  handlePaid: () => void;
  handleRetrospecStatusChange: (newStatus: string) => void;
  handleTransactionTypeChange: (newType: string) => void;
  handleWaitEmail: () => void;
  handlePriority: () => void;
  handleNuclear: () => void;
  handleMarkDone: (email: boolean) => void;
  handleSaveNotes: (notes: string) => void;
  
  // Reset
  reset: () => void;
}

const initialState: TransactionState = {
  transaction: null,
  transactionId: '',
  user: {} as User,
  bike: null,
  transactionType: '',
  totalPrice: 0,
  showCheckout: false,
  showBikeForm: false,
  showWaitingParts: false,
  refurb: false,
  reserved: false,
  waitEmail: false,
  waitPart: false,
  priority: false,
  nuclear: false,
  description: '',
  isPaid: false,
  isCompleted: false,
  beerBike: false,
  isEmployee: false,
  repairDetails: [],
  itemDetails: [],
  orderRequestData: [],
  isUpdating: false,
};

export const useTransactionStore = create<TransactionState & TransactionActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    initializeTransaction: (transactionId: string, user: User) => {
      set({ transactionId, user });
    },
    
    setTransaction: (transaction: Transaction) => {
      set({ transaction });
      // Sync flags from transaction data
      set({
        waitEmail: transaction.is_waiting_on_email ?? false,
        priority: transaction.is_urgent ?? false,
        nuclear: transaction.is_nuclear ?? false,
        description: transaction.description ?? '',
        isPaid: transaction.is_paid ?? false,
        isCompleted: transaction.is_completed ?? false,
        beerBike: transaction.is_beer_bike ?? false,
        refurb: transaction.is_refurb ?? false,
      });
    },
    
    // Basic setters
    setBike: (bike) => set({ bike }),
    setTransactionType: (transactionType) => set({ transactionType }),
    setTotalPrice: (totalPrice) => set({ totalPrice }),
    setShowCheckout: (showCheckout) => set({ showCheckout }),
    setShowBikeForm: (showBikeForm) => set({ showBikeForm }),
    setShowWaitingParts: (showWaitingParts) => set({ showWaitingParts }),
    setRefurb: (refurb) => set({ refurb }),
    setReserved: (reserved) => set({ reserved }),
    setWaitEmail: (waitEmail) => set({ waitEmail }),
    setWaitPart: (waitPart) => set({ waitPart }),
    setPriority: (priority) => set({ priority }),
    setNuclear: (nuclear) => set({ nuclear }),
    setDescription: (description) => set({ description }),
    setPaid: (isPaid) => set({ isPaid }),
    setCompleted: (isCompleted) => set({ isCompleted }),
    setBeerBike: (beerBike) => set({ beerBike }),
    setEmployee: (isEmployee) => set({ isEmployee }),
    setRepairDetails: (repairDetails) => set({ repairDetails }),
    setItemDetails: (itemDetails) => set({ itemDetails }),
    setOrderRequestData: (orderRequestData) => set({ orderRequestData }),
    
    updateTransaction: async () => {
      const state = get();
      if (!state.transaction) return;
      
      set({ isUpdating: true });
      try {
        const updatedTransaction: UpdateTransaction = {
          description: state.description || '',
          transaction_type: state.transactionType,
          total_cost: state.totalPrice,
          is_waiting_on_email: state.waitEmail,
          is_urgent: state.priority,
          is_nuclear: state.nuclear,
          is_completed: state.isCompleted,
          is_paid: state.isPaid,
          is_beer_bike: state.beerBike,
          is_refurb: state.refurb,
          is_reserved: state.reserved,
          is_employee: state.isEmployee,
          bike_id: state.bike?.bike_id,
          date_completed: !state.isCompleted
            ? null
            : state.transaction.date_completed === null && state.isCompleted
              ? new Date().toISOString()
              : state.transaction.date_completed,
        };
        
        await DBModel.updateTransaction(state.transactionId, updatedTransaction);
        queryClient.invalidateQueries({ queryKey: ['transaction', state.transactionId] });
      } catch (error) {
        toast.error('Error updating transaction: ' + error);
      } finally {
        set({ isUpdating: false });
      }
    },
    
    handlePaid: () => {
      const state = get();
      if (!state.transaction) return;
      
      set({ isPaid: true, waitEmail: false, nuclear: false, priority: false, showCheckout: false });
      
      // Trigger mutations
      DBModel.postTransactionLog(
        state.transaction.transaction_num,
        state.user.user_id,
        `checked out transaction for $${state.totalPrice}`,
        'transaction',
      );
      
      const customer = state.transaction.Customer;
      if (customer) {
        // Send receipt email mutation would be handled separately
      }
      
      queryClient.invalidateQueries({ queryKey: ['transaction', state.transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    
    handleRetrospecStatusChange: (newStatus: string) => {
      const state = get();
      switch (newStatus) {
        case 'Building':
          set({ refurb: true });
          break;
        case 'Completed':
          set({ refurb: false, waitEmail: true });
          break;
        case 'For Sale':
          set({ waitEmail: false, isCompleted: true });
          break;
        default:
          set({ isCompleted: false, waitEmail: false, refurb: false });
          break;
      }
      queryClient.invalidateQueries({ queryKey: ['transaction', state.transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    
    handleTransactionTypeChange: (newType: string) => {
      set({ transactionType: newType });
      queryClient.invalidateQueries({ queryKey: ['transaction', get().transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    
    handleWaitEmail: () => {
      set((state) => ({ waitEmail: !state.waitEmail }));
      queryClient.invalidateQueries({ queryKey: ['transaction', get().transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    
    handlePriority: () => {
      set((state) => ({ priority: !state.priority }));
      queryClient.invalidateQueries({ queryKey: ['transaction', get().transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    
    handleNuclear: () => {
      set((state) => ({ nuclear: !state.nuclear }));
      queryClient.invalidateQueries({ queryKey: ['transaction', get().transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    
    handleMarkDone: async (email: boolean) => {
      const state = get();
      if (!state.transaction || !state.transaction.Customer) return;
      
      set({ isCompleted: true });
      
      if (email) {
        // Send email mutation
        DBModel.postTransactionLog(
          state.transaction.transaction_num,
          state.user.user_id,
          'completed and sent email',
          'transaction',
        );
      }
      
      queryClient.invalidateQueries({ queryKey: ['transaction', state.transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    
    handleSaveNotes: (notes: string) => {
      // Process notes (same logic as current)
      const isValidLexical = (s: string) => {
        try {
          const p = JSON.parse(s);
          return typeof p === 'object' && p !== null;
        } catch {
          return false;
        }
      };
      
      const payload = isValidLexical(notes)
        ? notes
        : JSON.stringify({
            root: {
              children: [{ type: 'paragraph', children: [{ text: notes }] }],
            },
          });
      
      set({ description: payload });
      queryClient.resetQueries({ queryKey: ['transactionLogs', get().transactionId] });
    },
    
    reset: () => set(initialState),
  }))
);

// Auto-update transaction when relevant state changes
useTransactionStore.subscribe(
  (state) => ({
    description: state.description,
    totalPrice: state.totalPrice,
    waitEmail: state.waitEmail,
    priority: state.priority,
    nuclear: state.nuclear,
    isCompleted: state.isCompleted,
    showCheckout: state.showCheckout,
    bike: state.bike,
    beerBike: state.beerBike,
    refurb: state.refurb,
    reserved: state.reserved,
    transactionType: state.transactionType,
    isEmployee: state.isEmployee,
  }),
  (current, previous) => {
    // Only update if transaction data is loaded and not currently updating
    if (current.transaction && !current.isUpdating) {
      // Debounce or check if values actually changed
      const hasChanged = Object.keys(current).some(key => current[key] !== previous[key]);
      if (hasChanged) {
        get().updateTransaction();
      }
    }
  }
);
```

## Component Refactoring

Update `TransactionPage.tsx` to use the store:

```typescript
// Remove all useState declarations and replace with store usage
const TransactionDetail = ({ propUser }: TransactionDetailProps) => {
  const { transaction_id } = useParams();
  const nav = useNavigate();
  
  // Use store
  const store = useTransactionStore();
  
  // Initialize store on mount
  useEffect(() => {
    if (transaction_id) {
      store.initializeTransaction(transaction_id, propUser);
    }
  }, [transaction_id, propUser]);
  
  // Update store when transaction data changes
  useEffect(() => {
    if (transactionData) {
      store.setTransaction(transactionData);
    }
  }, [transactionData]);
  
  // Update data in store
  useEffect(() => {
    store.setRepairDetails(repairDetails || []);
    store.setItemDetails(itemDetails || []);
    store.setOrderRequestData(orderRequestData || []);
  }, [repairDetails, itemDetails, orderRequestData]);
  
  // Calculate total price (could be moved to store as computed value)
  useEffect(() => {
    if (!repairDetailsIsFetching && !itemDetailsIsFetching && !orderRequestIsFetching) {
      const total = calculateTotalCost(
        store.repairDetails,
        store.itemDetails,
        store.orderRequestData,
        store.isEmployee,
        store.beerBike,
      );
      store.setTotalPrice(total);
    }
  }, [
    store.repairDetails,
    store.itemDetails,
    store.orderRequestData,
    store.isEmployee,
    store.beerBike,
    repairDetailsIsFetching,
    itemDetailsIsFetching,
    orderRequestIsFetching,
  ]);
  
  // Replace all state setters with store actions
  // e.g., setPaid(true) becomes store.setPaid(true)
  // e.g., handlePaid becomes store.handlePaid()
  
  // ... rest of component remains similar but uses store.state instead of local state
};
```

## Benefits

1. **Centralized State**: All transaction-related state in one place
2. **Reduced Complexity**: Fewer useEffect hooks and state variables
3. **Better Performance**: Selective subscriptions and batched updates
4. **Easier Testing**: Store logic can be tested independently
5. **Type Safety**: Full TypeScript support with defined interfaces

## Migration Steps

1. Create the store file as shown above
2. Update imports in `TransactionPage.tsx`
3. Replace all `useState` calls with store usage
4. Replace state setters with store actions
5. Move effect logic into store actions or subscribers
6. Test thoroughly, especially state synchronization

## Considerations

- **Mutations**: Keep React Query mutations separate or integrate them into store actions
- **Subscriptions**: Use `subscribeWithSelector` for performance
- **Persistence**: Add persistence middleware if needed for page refreshes
- **Multiple Instances**: If multiple transaction pages can be open, consider scoping the store per transaction ID

This refactoring will significantly simplify the component and make state management more maintainable.