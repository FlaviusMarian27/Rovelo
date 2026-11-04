import { Redirect } from 'expo-router';

import { useSession } from '@/context/session';

// "/" nu are ecran propriu: trimite spre Welcome sau spre Home.
// Atenție: grupurile cu paranteze nu sunt rute, deci NU "/(auth)".
export default function Index() {
  const { user } = useSession();
  return <Redirect href={user ? '/home' : '/welcome'} />;
}
