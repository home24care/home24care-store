'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import type { Product } from './catalog';

export type CartLine = {
  slug: string;
  title: string;
  price: number;
  image: string;
  sku: string;
  quantity: number;
  maxQuantity: number;
};

type State = { lines: CartLine[]; hydrated: boolean };

type Action =
  | { type: 'hydrate'; lines: CartLine[] }
  | { type: 'add'; line: CartLine }
  | { type: 'setQuantity'; slug: string; quantity: number }
  | { type: 'remove'; slug: string }
  | { type: 'clear' };

const STORAGE_KEY = 'h24c.cart.v1';
const MAX_PER_LINE = 10;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { lines: action.lines, hydrated: true };

    case 'add': {
      const existing = state.lines.find((l) => l.slug === action.line.slug);
      if (!existing) return { ...state, lines: [...state.lines, action.line] };
      const quantity = Math.min(
        existing.quantity + action.line.quantity,
        existing.maxQuantity
      );
      return {
        ...state,
        lines: state.lines.map((l) => (l.slug === action.line.slug ? { ...l, quantity } : l)),
      };
    }

    case 'setQuantity': {
      if (action.quantity <= 0) {
        return { ...state, lines: state.lines.filter((l) => l.slug !== action.slug) };
      }
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.slug === action.slug
            ? { ...l, quantity: Math.min(action.quantity, l.maxQuantity) }
            : l
        ),
      };
    }

    case 'remove':
      return { ...state, lines: state.lines.filter((l) => l.slug !== action.slug) };

    case 'clear':
      return { ...state, lines: [] };
  }
}

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], hydrated: false });
  const [isOpen, setIsOpen] = useState(false);

  // Restore from localStorage once, after mount, so SSR markup stays stable.
  useEffect(() => {
    let lines: CartLine[] = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          lines = parsed.filter(
            (l): l is CartLine =>
              l && typeof l.slug === 'string' && typeof l.quantity === 'number'
          );
        }
      }
    } catch {
      // Corrupt or unavailable storage: start with an empty cart.
    }
    dispatch({ type: 'hydrate', lines });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // Storage full or blocked — the cart still works for this page view.
    }
  }, [state.lines, state.hydrated]);

  // Clear the cart after Stripe redirects back from a completed session.
  useEffect(() => {
    if (!state.hydrated) return;
    if (window.location.pathname === '/checkout/success') dispatch({ type: 'clear' });
  }, [state.hydrated]);

  const add = useCallback((product: Product, quantity = 1) => {
    dispatch({
      type: 'add',
      line: {
        slug: product.slug,
        title: product.title,
        price: product.price,
        image: product.images[0]?.thumb ?? '',
        sku: product.sku,
        quantity,
        maxQuantity: MAX_PER_LINE,
      },
    });
    setIsOpen(true);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = state.lines.reduce((n, l) => n + l.price * l.quantity, 0);
    return {
      lines: state.lines,
      hydrated: state.hydrated,
      count,
      subtotal,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      setQuantity: (slug, quantity) => dispatch({ type: 'setQuantity', slug, quantity }),
      remove: (slug) => dispatch({ type: 'remove', slug }),
      clear: () => dispatch({ type: 'clear' }),
    };
  }, [state.lines, state.hydrated, isOpen, add]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
