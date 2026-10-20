import { createContext } from 'react';

/** The root layout supplies presentation for the selected route group. */
export const ConversationNameField = createContext<'client_name' | 'provider_name' | null>(null);
