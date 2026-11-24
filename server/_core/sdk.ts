import axios from "axios";
import { AXIOS_TIMEOUT_MS, decodeOAuthState } from "../../shared/const";
import { ENV } from "./env";
import type {
  ExchangeTokenResponse,
  GetUserInfoResponse,
} from "./types/manusTypes";

const client = axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS,
});
/** Managed provider transport only. App sessions are issued by identityService. */
export const sdk = {
  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    const { data } = await client.post<ExchangeTokenResponse>(
      "/webdev.v1.WebDevAuthPublicService/ExchangeToken",
      {
        clientId: ENV.appId,
        grantType: "authorization_code",
        code,
        redirectUri: decodeOAuthState(state).redirectUri,
      }
    );
    return data;
  },
  async getUserInfo(
    accessToken: string
  ): Promise<GetUserInfoResponse & { loginMethod?: string | null }> {
    const { data } = await client.post<GetUserInfoResponse>(
      "/webdev.v1.WebDevAuthPublicService/GetUserInfo",
      { accessToken }
    );
    return data;
  },
};
