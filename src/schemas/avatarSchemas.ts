import { z } from 'zod';

const AvatarLayerCategorySchema = z.enum([
  'shoulders',
  'clothing',
  'base',
  'skinTone',
  'eyes',
  'mouth',
  'hair',
  'facialHair',
  'markings',
  'accessories',
]);

const AvatarLayerSchema = z.object({
  category: AvatarLayerCategorySchema,
  src: z.string(),
  tint: z.string().optional(),
  offset: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  z: z.number(),
});

const AvatarEntityTypeSchema = z.enum(['warrior', 'trainer', 'poolWarrior', 'owner', 'promoter']);
const AvatarGenderSchema = z.enum(['masc', 'fem', 'neutral']);
const AvatarAgeGroupSchema = z.enum(['young', 'adult', 'middle', 'elder']);

export const AvatarDataSchema = z.object({
  seed: z.number(),
  entityType: AvatarEntityTypeSchema,
  gender: AvatarGenderSchema,
  ageGroup: AvatarAgeGroupSchema,
  primaryColor: z.string(),
  secondaryColor: z.string().optional(),
  layers: z.array(AvatarLayerSchema),
  generatedAtWeek: z.number().optional(),
  description: z.string().optional(),
});
