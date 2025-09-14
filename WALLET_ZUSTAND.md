# Wallet Data Management with Zustand

This implementation uses Zustand for managing wallet data consistently across the entire application.

## Key Benefits

1. **No More Data Inconsistency**: Single source of truth for wallet data
2. **No Repeated API Calls**: Data is fetched once and shared across components
3. **Automatic Updates**: Components automatically re-render when data changes
4. **Simple API**: Easy to use hooks with clean syntax

## Files Structure

```
src/
├── stores/
│   ├── useWalletStore.ts      # Main Zustand store
│   └── useWalletUtils.ts      # Utility hooks for common operations
└── app/pages/wallet/
    ├── Home.tsx               # Cleaned up - no state management
    └── wallet/YourWallet.tsx  # Uses store instead of local state
```

## Usage Examples

### Basic Usage in Components

```tsx
import useWalletStore from '../stores/useWalletStore';

const MyComponent = () => {
  const { spentHours, budgetHours, remainingHours, isLoading } = useWalletStore();
  
  return (
    <div>
      <p>Spent: {spentHours}</p>
      <p>Remaining: {remainingHours}</p>
    </div>
  );
};
```

### Triggering Data Refresh

```tsx
import { useWalletUtils } from '../stores/useWalletUtils';

const TaskComponent = () => {
  const { refreshWalletAfterTaskChange } = useWalletUtils();
  
  const handleTaskComplete = async () => {
    // ... update task logic
    await refreshWalletAfterTaskChange(); // Refresh wallet data
  };
};
```

### Manual Data Fetching

```tsx
import useWalletStore from '../stores/useWalletStore';

const SomeComponent = () => {
  const fetchSpentHours = useWalletStore((state) => state.fetchSpentHours);
  
  useEffect(() => {
    fetchSpentHours(); // Fetch data when needed
  }, [fetchSpentHours]);
};
```

## Store State

- `spentHours`: Number of hours spent today
- `budgetHours`: Total budget hours (currently 15)
- `remainingHours`: Computed value (budget - spent)
- `isLoading`: Loading state for API calls
- `error`: Error message if API call fails
- `lastUpdated`: Timestamp of last successful update

## Store Actions

- `fetchSpentHours()`: Fetch data from API
- `updateSpentHours(hours)`: Update spent hours manually
- `refreshData()`: Alias for fetchSpentHours
- `clearError()`: Clear any error state

## Integration Points

When you need to refresh wallet data after task operations:

1. **Task Creation**: Call `refreshWalletAfterTaskChange()` after creating tasks
2. **Task Updates**: Call `refreshWalletAfterTaskChange()` after updating task times
3. **Task Deletion**: Call `refreshWalletAfterTaskChange()` after deleting tasks

This ensures the wallet always shows current, accurate data across all pages.
