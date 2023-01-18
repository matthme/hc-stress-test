import { createContext } from '@lit-labs/context';
import { AppAgentWebsocket, AppInfo } from '@holochain/client';

export const appAgentWebsocketContext = createContext<AppAgentWebsocket>('appWebsocket');
export const appInfoContext = createContext<AppInfo>('appInfo');
