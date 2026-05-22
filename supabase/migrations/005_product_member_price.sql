ALTER TABLE public.products 
ADD COLUMN member_price numeric(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.products 
ADD CONSTRAINT products_member_price_check CHECK (member_price >= 0);
