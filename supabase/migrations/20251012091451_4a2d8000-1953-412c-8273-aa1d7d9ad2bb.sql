-- Add parent_id column to categories table to support subcategories
ALTER TABLE public.categories
ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- Add comment for documentation
COMMENT ON COLUMN public.categories.parent_id IS 'Reference to parent category. NULL for main categories, UUID for subcategories';