export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          headline: string | null
          bio: string | null
          avatar_url: string | null
          cover_url: string | null
          industry_id: number | null
          location: string | null
          website: string | null
          theme_accent: string
          theme_bg: string
          theme_text: string
          theme_pattern: string
          connection_count: number
          post_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          headline?: string | null
          bio?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          industry_id?: number | null
          location?: string | null
          website?: string | null
          theme_accent?: string
          theme_bg?: string
          theme_text?: string
          theme_pattern?: string
          connection_count?: number
          post_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          headline?: string | null
          bio?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          industry_id?: number | null
          location?: string | null
          website?: string | null
          theme_accent?: string
          theme_bg?: string
          theme_text?: string
          theme_pattern?: string
          connection_count?: number
          post_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      experiences: {
        Row: {
          id: number
          user_id: string
          title: string
          company: string
          location: string | null
          start_date: string
          end_date: string | null
          current: boolean
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          company: string
          location?: string | null
          start_date: string
          end_date?: string | null
          current?: boolean
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          company?: string
          location?: string | null
          start_date?: string
          end_date?: string | null
          current?: boolean
          description?: string | null
          created_at?: string
        }
      }
      education: {
        Row: {
          id: number
          user_id: string
          institution: string
          degree: string | null
          field: string | null
          start_year: number
          end_year: number | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          institution: string
          degree?: string | null
          field?: string | null
          start_year: number
          end_year?: number | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          institution?: string
          degree?: string | null
          field?: string | null
          start_year?: number
          end_year?: number | null
          description?: string | null
          created_at?: string
        }
      }
      skills: {
        Row: {
          id: number
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      connections: {
        Row: {
          id: number
          requester_id: string
          addressee_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          requester_id: string
          addressee_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          requester_id?: string
          addressee_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: number
          author_id: string
          content: string
          image_url: string | null
          industry_id: number | null
          like_count: number
          comment_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          author_id: string
          content: string
          image_url?: string | null
          industry_id?: number | null
          like_count?: number
          comment_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          author_id?: string
          content?: string
          image_url?: string | null
          industry_id?: number | null
          like_count?: number
          comment_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      post_likes: {
        Row: {
          id: number
          post_id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: number
          post_id: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          user_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: number
          post_id: number
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: number
          post_id: number
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          author_id?: string
          content?: string
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: number
          participant_1: string
          participant_2: string
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: number
          participant_1: string
          participant_2: string
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: number
          participant_1?: string
          participant_2?: string
          last_message_at?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: number
          conversation_id: number
          sender_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: number
          conversation_id: number
          sender_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          conversation_id?: number
          sender_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: number
          name: string
          slug: string
          description: string | null
          icon: string | null
          industry_id: number | null
          member_count: number
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          industry_id?: number | null
          member_count?: number
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          industry_id?: number | null
          member_count?: number
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: number
          group_id: number
          user_id: string
          role: 'member' | 'admin'
          created_at: string
        }
        Insert: {
          id?: number
          group_id: number
          user_id: string
          role?: 'member' | 'admin'
          created_at?: string
        }
        Update: {
          id?: number
          group_id?: number
          user_id?: string
          role?: 'member' | 'admin'
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: number
          user_id: string
          type: 'connection_request' | 'connection_accepted' | 'post_like' | 'post_comment' | 'message' | 'group_invite'
          actor_id: string | null
          entity_type: string | null
          entity_id: number | null
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          type: 'connection_request' | 'connection_accepted' | 'post_like' | 'post_comment' | 'message' | 'group_invite'
          actor_id?: string | null
          entity_type?: string | null
          entity_id?: number | null
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          type?: 'connection_request' | 'connection_accepted' | 'post_like' | 'post_comment' | 'message' | 'group_invite'
          actor_id?: string | null
          entity_type?: string | null
          entity_id?: number | null
          message?: string
          read?: boolean
          created_at?: string
        }
      }
      industries: {
        Row: {
          id: number
          name: string
          slug: string
          icon: string | null
        }
        Insert: {
          id?: number
          name: string
          slug: string
          icon?: string | null
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          icon?: string | null
        }
      }
      jobs: {
        Row: {
          id: number
          poster_id: string
          title: string
          company: string
          company_logo_url: string | null
          location: string
          location_type: 'onsite' | 'remote' | 'hybrid'
          employment_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'
          industry_id: number | null
          description: string
          requirements: string | null
          salary_min: number | null
          salary_max: number | null
          salary_currency: string
          apply_url: string | null
          apply_email: string | null
          is_active: boolean
          application_count: number
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          poster_id: string
          title: string
          company: string
          company_logo_url?: string | null
          location: string
          location_type?: 'onsite' | 'remote' | 'hybrid'
          employment_type?: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'
          industry_id?: number | null
          description: string
          requirements?: string | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          apply_url?: string | null
          apply_email?: string | null
          is_active?: boolean
          application_count?: number
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          poster_id?: string
          title?: string
          company?: string
          company_logo_url?: string | null
          location?: string
          location_type?: 'onsite' | 'remote' | 'hybrid'
          employment_type?: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'
          industry_id?: number | null
          description?: string
          requirements?: string | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          apply_url?: string | null
          apply_email?: string | null
          is_active?: boolean
          application_count?: number
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      job_saves: {
        Row: {
          id: number
          job_id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: number
          job_id: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: number
          job_id?: number
          user_id?: string
          created_at?: string
        }
      }
      job_applications: {
        Row: {
          id: number
          job_id: number
          applicant_id: string
          cover_letter: string | null
          status: 'applied' | 'viewed' | 'shortlisted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          job_id: number
          applicant_id: string
          cover_letter?: string | null
          status?: 'applied' | 'viewed' | 'shortlisted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          job_id?: number
          applicant_id?: string
          cover_letter?: string | null
          status?: 'applied' | 'viewed' | 'shortlisted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      get_feed: {
        Args: { p_user_id: string; p_page_size?: number; p_page_offset?: number; p_filter_industry?: number | null }
        Returns: Array<{
          id: number
          author_id: string
          content: string
          image_url: string | null
          industry_id: number | null
          like_count: number
          comment_count: number
          created_at: string
          author_name: string | null
          author_username: string | null
          author_avatar: string | null
          author_headline: string | null
          user_liked: boolean
        }>
      }
      search_profiles: {
        Args: { search_query: string; result_limit?: number }
        Returns: Array<Database['public']['Tables']['profiles']['Row']>
      }
      search_posts: {
        Args: { search_query: string; result_limit?: number }
        Returns: Array<Database['public']['Tables']['posts']['Row']>
      }
    }
    Enums: Record<string, never>
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Experience = Database['public']['Tables']['experiences']['Row']
export type Education = Database['public']['Tables']['education']['Row']
export type Skill = Database['public']['Tables']['skills']['Row']
export type Connection = Database['public']['Tables']['connections']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type PostLike = Database['public']['Tables']['post_likes']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Industry = Database['public']['Tables']['industries']['Row']

export type Job = Database['public']['Tables']['jobs']['Row']
export type JobSave = Database['public']['Tables']['job_saves']['Row']
export type JobApplication = Database['public']['Tables']['job_applications']['Row']

export type FeedPost = Database['public']['Functions']['get_feed']['Returns'][number]
