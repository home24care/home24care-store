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
import { track } from './analytics/client';
import { ADS_CONVERSIONS, adsConversion, ga4Event } from './gtag';

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
    const valueCents = product.price * quantity;

    track('add_to_cart', {
      slug: product.slug,
      quantity,
      value: valueCents,
    });

    /*
      Google Ads add-to-cart conversion, and the matching GA4 ecommerce event.

      Reported here rather than on the cart page, because this is the one place
      every add passes through — the product page, a collection card, the
      related-products strip. Firing it where the cart renders would count a
      conversion again on every re-render, every drawer open and every reload.

      The value is the real line total in dollars, and the currency is the
      product's own. Google's generated snippet carries `1.0` and `EUR` as
      placeholders; sent literally, a $17 cooler and a $919 gazebo would both
      report as one euro, which leaves Ads nothing to bid on and misstates the
      currency of a shop that sells in USD.
    */
    adsConversion(ADS_CONVERSIONS.addToCart, valueCents / 100, product.currency);
    ga4Event('add_to_cart', {
      currency: product.currency,
      value: valueCents / 100,
      items: [
        {
          item_id: product.sku,
          item_name: product.title,
          item_brand: product.brand,
          price: product.price / 100,
          quantity,
        },
      ],
    });
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
      remove: (slug) => {
        track('remove_from_cart', { slug });
        dispatch({ type: 'remove', slug });
      },
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
