import { Link, type Href } from 'expo-router';
import { Text } from 'react-native';

import { fonts, fontSize } from '@/constants/theme';
import { makeStyles } from '@/context/theme';

// "New to Rovelo? Create account" — replace ca să nu se adune login/register în stack.
export function FooterLink({ text, link, href }: { text: string; link: string; href: Href }) {
  const styles = useStyles();
  return (
    <Text style={styles.text}>
      {text}{' '}
      <Link href={href} replace style={styles.link}>
        {link}
      </Link>
    </Text>
  );
}

const useStyles = makeStyles((colors) => ({
  text: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textSecondary },
  link: { fontFamily: fonts.semibold, color: colors.primary },
}));
