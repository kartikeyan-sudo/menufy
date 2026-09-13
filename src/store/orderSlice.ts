import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OrderState {
  currentOrder: {
    id: string;
    orderNumber: string;
    tableNumber: string;
    totalAmount: number;
    status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'rejected';
    items: { name: string; quantity: number; price: number }[];
    lastUpdated?: string;
  } | null;
  isPolling: boolean;
}

const initialState: OrderState = {
  currentOrder: null,
  isPolling: false,
};

export const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setOrder: (state, action: PayloadAction<OrderState['currentOrder']>) => {
      state.currentOrder = action.payload;
    },
    updateOrderStatus: (state, action: PayloadAction<OrderState['currentOrder'] extends null ? never : NonNullable<OrderState['currentOrder']>['status']>) => {
      if (state.currentOrder) {
        state.currentOrder.status = action.payload as any;
        state.currentOrder.lastUpdated = new Date().toISOString();
      }
    },
    setIsPolling: (state, action: PayloadAction<boolean>) => {
      state.isPolling = action.payload;
    },
    clearOrder: (state) => {
      state.currentOrder = null;
    },
  },
});

export const { setOrder, updateOrderStatus, setIsPolling, clearOrder } = orderSlice.actions;
export default orderSlice.reducer;
