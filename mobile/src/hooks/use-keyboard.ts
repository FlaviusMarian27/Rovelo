// true cât e deschisă tastatura (ex. ca să ascundem harta și butoanele care i-ar lua locul).
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}
