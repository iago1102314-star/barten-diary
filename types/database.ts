export type Diary = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  transcript: string | null;
  master_comment: string | null;
  created_at: string;
  updated_at: string;
};
