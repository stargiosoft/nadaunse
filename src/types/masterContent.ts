export interface MasterContent {
  id: number;
  content_type: string;
  title: string;
  status: string;
  created_at: string;
  updated_at?: string;
  thumbnail_url: string | null;
  weekly_clicks: number;
  view_count: number;
  category_main: string;
  category_sub: string;
  price_original: number;
  price_discount: number;
  discount_rate: number;
}
