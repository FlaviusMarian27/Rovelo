import { Link, type Href } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSize } from '@/constants/theme';

// "New to Rovelo? Create account" — replace ca să nu se adune login/register în stack.
export function FooterLink({ text, link, href }: { text: string; link: string; href: Href }) {
  return (
    <Text style={styles.text}>
      {text}{' '}
      <Link href={href} replace style={styles.link}>
        {link}
      </Link>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textSecondary },
  link: { fontFamily: fonts.semibold, color: colors.primary },
});
