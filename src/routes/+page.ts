import type { EntryGenerator } from './[locale]/$types';

export const entries: EntryGenerator = () => {
    return [
        { locale: 'en' },
        { locale: 'zh' },
        { locale: 'ja' }
    ];
};
