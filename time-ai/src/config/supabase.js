// Supabase initialization has been disabled as part of migration to Firebase-only architecture
// All Supabase-related functionality has been removed from the application

// Export a mock supabase object to prevent breaking existing imports
const supabase = {
  disabled: true,
  message: 'Supabase integration has been disabled - using Firebase-only architecture'
};

export { supabase };
export default supabase;
