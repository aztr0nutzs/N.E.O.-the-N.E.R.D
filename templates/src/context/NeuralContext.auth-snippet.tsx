// Replace the Firebase auth subscription block in NeuralContext.tsx with this Supabase session subscription pattern.
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const [user, setUser] = useState<User | null>(null);
const [authLoading, setAuthLoading] = useState(true);

useEffect(() => {
  let mounted = true;

  supabase.auth.getUser().then(({ data, error }) => {
    if (!mounted) return;
    if (error) {
      console.error('Initial auth lookup failed', error);
      setUser(null);
    } else {
      setUser(data.user ?? null);
    }
    setAuthLoading(false);
  });

  const { data: subscription } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
    if (!mounted) return;
    setUser(session?.user ?? null);
    setAuthLoading(false);
  });

  return () => {
    mounted = false;
    subscription.subscription.unsubscribe();
  };
}, []);
