import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  loader: glob({
    base: './src/content/articles',
    pattern: '**/*.md',
  }),
  schema: z.object({
    // These fields are the long-term, portable Markdown contract. The remaining
    // metadata is optional enrichment emitted by the legacy migrator or a future
    // reviewed Admin snapshot.
    title: z.string().trim().min(1),
    author: z.string().trim().min(1),
    date: z.string().trim().min(1),
    tags: z.array(z.string()).default([]),
    ignore: z.boolean().default(false),
    plain: z.boolean().default(false),
    legacySlug: z.string().trim().min(1),
    visibility: z.enum(['public', 'unlisted', 'private']),
    publishedAt: z.string().trim().min(1).optional(),
    updatedAt: z.string().trim().min(1).optional(),
    description: z.string().default(''),
    type: z.enum(['writing', 'log']).default('writing'),
  }),
});

export const collections = { articles };
