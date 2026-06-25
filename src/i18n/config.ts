import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ICU from 'i18next-icu';
import en from '../locales/en.json';

const isDebugI18n = new URLSearchParams(window.location.search).get('debug_i18n') === 'true';

// Length expansion post-processor for +30% text length
const pseudoProcessor = {
  name: 'pseudo',
  type: 'postProcessor',
  process: (value: string) => {
    if (!isDebugI18n) return value;
    
    // Skip empty strings
    if (!value || value.length === 0) return value;

    // We expand the string by approximately 30%.
    const expansionLength = Math.ceil(value.length * 0.3);
    const expansionText = " ẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋẋ";
    
    return value + expansionText.substring(0, expansionLength);
  }
};

i18n
  .use(ICU)
  .use({
    type: 'postProcessor',
    name: 'pseudo',
    process: pseudoProcessor.process
  })
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    postProcess: isDebugI18n ? ['pseudo'] : [],
    interpolation: {
      escapeValue: false // React already escapes by default
    }
  });

export default i18n;
