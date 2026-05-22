export type Diary = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  transcript: string | null;
  master_comment: string | null;
  drink_note: string | null;
  continued_from_diary_id: string | null;
  continued_from_bottle_tag: string | null;
  created_at: string;
  updated_at: string;
};
