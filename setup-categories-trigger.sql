-- Create the function to insert default categories
CREATE OR REPLACE FUNCTION public.handle_new_user_categories() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, color)
  VALUES 
    (NEW.id, 'Housing', 'Home', 'bg-signature-coral'),
    (NEW.id, 'Food', 'ShoppingCart', 'bg-signature-forest'),
    (NEW.id, 'Utilities', 'Zap', 'bg-signature-mustard'),
    (NEW.id, 'Transportation', 'Car', 'bg-signature-peach'),
    (NEW.id, 'Healthcare', 'HeartPulse', 'bg-signature-mint'),
    (NEW.id, 'Entertainment', 'Ticket', 'bg-signature-yellow'),
    (NEW.id, 'Dining Out', 'Utensils', 'bg-info'),
    (NEW.id, 'Shopping', 'ShoppingBag', 'bg-signature-cream'),
    (NEW.id, 'Education', 'GraduationCap', 'bg-success'),
    (NEW.id, 'Personal Care', 'Sparkles', 'bg-primary');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_categories();
