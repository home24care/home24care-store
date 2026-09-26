/**
 * Reviews of individual products, shown only in that product's Reviews tab.
 *
 * Genuine customer feedback only. How these reach us (by email, from buyers
 * who purchased directly) is disclosed in the Privacy Policy under "Customer
 * reviews". These are not store reviews: they never feed the store rating in
 * reviews.ts, the homepage section, the buy-box stars on other products or any
 * structured data. Dates are left out rather than guessed when we do not have
 * them.
 */
export type ProductReview = {
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
};

export const productReviews: Record<string, ProductReview[]> = {
  'pokemon-30th-celebration-elite-trainer-box': [
    {
      author: 'Michael R.',
      rating: 5,
      body: 'Really happy with the 30th Celebration ETB. The artwork looks even better in person, and opening the packs was a lot of fun. Definitely a nice box for any Pokémon collector.',
    },
    {
      author: 'Jason M.',
      rating: 5,
      body: 'I bought this mainly for the 30th anniversary theme and wasn’t disappointed. The box looks great, the cards were packed nicely, and I had a really enjoyable opening experience.',
    },
    {
      author: 'Emily T.',
      rating: 5,
      body: 'Such a fun ETB to open! I loved seeing the different Pikachu artwork throughout the packs. Everything arrived safely and in excellent condition.',
    },
    {
      author: 'Chris W.',
      rating: 5,
      body: 'Great addition to my Pokémon collection. The anniversary design is awesome and the overall presentation feels really special. I’m glad I picked one up.',
    },
    {
      author: 'Daniel S.',
      rating: 5,
      body: 'Really enjoyed this set. The cards have a great look to them and opening each pack was exciting. The ETB itself is also something I’ll probably keep for the collection.',
    },
    {
      author: 'Ashley K.',
      rating: 5,
      body: 'Very happy with my purchase. The box arrived in perfect condition and the 30th anniversary artwork is beautiful. It was a great experience from ordering to opening.',
    },
    {
      author: 'Ryan T.',
      rating: 5,
      body: 'Absolutely loved this ETB. It has that special anniversary feel and was really fun to open. Everything was exactly as expected and the packaging was excellent.',
    },
  ],
};

export const reviewsFor = (slug: string): ProductReview[] => productReviews[slug] ?? [];
