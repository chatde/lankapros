import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const profileSchema = z.object({
  full_name: z.string().min(2).max(100).nullable(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).nullable(),
  headline: z.string().max(200).nullable(),
  bio: z.string().max(2000).nullable(),
  location: z.string().max(100).nullable(),
  website: z.string().url().max(200).nullable().or(z.literal('')),
  industry_id: z.number().int().positive().nullable(),
})

export const postSchema = z.object({
  content: z.string().min(1, 'Post cannot be empty').max(5000),
  industry_id: z.number().int().positive().nullable().optional(),
})

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
})

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
})

export const experienceSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  location: z.string().max(100).nullable().optional(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  current: z.boolean().default(false),
  description: z.string().max(2000).nullable().optional(),
})

export const educationSchema = z.object({
  institution: z.string().min(1).max(200),
  degree: z.string().max(200).nullable().optional(),
  field: z.string().max(200).nullable().optional(),
  start_year: z.number().int().min(1950).max(2030),
  end_year: z.number().int().min(1950).max(2030).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type PostInput = z.infer<typeof postSchema>
export type CommentInput = z.infer<typeof commentSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type ExperienceInput = z.infer<typeof experienceSchema>
export type EducationInput = z.infer<typeof educationSchema>
